import test from 'node:test';
import assert from 'node:assert/strict';
import * as nodeModule from 'node:module';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

interface ResolveContext {
  parentURL?: string;
}

interface ResolveResult {
  url: string;
  shortCircuit?: boolean;
}

type NextResolve = (specifier: string, context: ResolveContext) => ResolveResult;

const moduleWithHooks = nodeModule as unknown as {
  createRequire: typeof nodeModule.createRequire;
  registerHooks?: (hooks: {
    resolve: (specifier: string, context: ResolveContext, nextResolve: NextResolve) => ResolveResult;
  }) => void;
};

if (typeof moduleWithHooks.registerHooks === 'function') {
  moduleWithHooks.registerHooks({
    resolve(specifier, context, nextResolve) {
      if (
        (specifier.startsWith('./') || specifier.startsWith('../')) &&
        !/\.[a-z]+$/i.test(specifier) &&
        context.parentURL
      ) {
        const parentDir = dirname(fileURLToPath(context.parentURL));
        const tsCandidate = resolve(parentDir, `${specifier}.ts`);
        if (existsSync(tsCandidate)) {
          return {
            url: new URL(`${specifier}.ts`, context.parentURL).href,
            shortCircuit: true,
          };
        }
        const indexCandidate = resolve(parentDir, specifier, 'index.ts');
        if (existsSync(indexCandidate)) {
          return {
            url: new URL(`${specifier.replace(/\/+$/, '')}/index.ts`, context.parentURL).href,
            shortCircuit: true,
          };
        }
      }
      return nextResolve(specifier, context);
    },
  });
}

const require = moduleWithHooks.createRequire(import.meta.url);
const apiMod = require('./api.ts') as typeof import('./api');
const apiErrorMod = require('./apiError.ts') as typeof import('./apiError');

function createAbortAwareBodyResponse(params: {
  ok: boolean;
  status: number;
  statusText: string;
  delayMs: number;
  bodyText: string;
  signal?: AbortSignal;
}): Response {
  return {
    ok: params.ok,
    status: params.status,
    statusText: params.statusText,
    text: () =>
      new Promise<string>((resolveBody, rejectBody) => {
        if (params.signal?.aborted) {
          rejectBody(new DOMException('The operation was aborted', 'AbortError'));
          return;
        }
        const timer = setTimeout(() => {
          resolveBody(params.bodyText);
        }, params.delayMs);
        params.signal?.addEventListener(
          'abort',
          () => {
            clearTimeout(timer);
            rejectBody(new DOMException('The operation was aborted', 'AbortError'));
          },
          { once: true }
        );
      }),
  } as unknown as Response;
}

function createHungBodyResponse(params: {
  ok: boolean;
  status: number;
  statusText: string;
}): Response {
  return {
    ok: params.ok,
    status: params.status,
    statusText: params.statusText,
    // Simulates a response stream whose `.text()` ignores AbortSignal and hangs forever
    text: () =>
      new Promise<string>(() => {
        /* deliberately unsettled until external timeout rejects */
      }),
  } as unknown as Response;
}

test('AUD-M1-02: error sanitization removes Windows, Linux, Unix paths and tracebacks without over-sanitizing valid validation text', () => {
  const { extractApiErrorMessage, getErrorMessage, formatApiErrorDetail } = apiErrorMod;

  // Windows path (4xx detail and generic error)
  const winErr = extractApiErrorMessage(
    { detail: 'Failed reading D:\\files\\project\\mirah.db' },
    400,
    'Bad Request'
  );
  assert.ok(!winErr.includes('D:\\files\\project'), `Leaked Windows path: ${winErr}`);
  assert.match(winErr, /HTTP 400/);

  // Unix / Linux paths
  for (const leakyPath of [
    'Error inside /app/app/services/session_service.py line 42',
    'Permission error at /home/user/.config/mirah/key.pem',
    'Missing binary in /usr/local/bin/ffmpeg',
    'Cannot access /var/log/mirah/error.log',
    'Config failed at /etc/mirah/secrets.env',
    'Runtime traceback:\nTraceback (most recent call last):\n  File "/Users/dev/app.py"',
  ]) {
    const out = extractApiErrorMessage({ detail: leakyPath }, 422, 'Unprocessable Entity');
    assert.ok(!out.includes('/app/'), `Leaked /app/ path: ${out}`);
    assert.ok(!out.includes('/home/user'), `Leaked /home/user path: ${out}`);
    assert.ok(!out.includes('/usr/local'), `Leaked /usr/local path: ${out}`);
    assert.ok(!out.includes('/var/log'), `Leaked /var/log path: ${out}`);
    assert.ok(!out.includes('/etc/'), `Leaked /etc/ path: ${out}`);
    assert.ok(!out.includes('/Users/dev'), `Leaked /Users/dev path: ${out}`);
    assert.ok(!out.toLowerCase().includes('traceback'), `Leaked traceback: ${out}`);
    assert.match(out, /HTTP 422/);

    const fallbackMsg = getErrorMessage(new Error(leakyPath), 'Safe fallback');
    assert.equal(fallbackMsg, 'Safe fallback');
  }

  // Ordinary safe validation messages with slashes/quotes/colons MUST be preserved intact
  const safeValidationCases = [
    'Supported sign languages are ISL/ASL and English/Hindi.',
    "Session 'sess-42' not found.",
    'Input text must be between 1 and 500 characters.',
    'Unsupported path parameter for endpoint /api/v1/sessions.',
  ];
  for (const safeMsg of safeValidationCases) {
    const formatted = extractApiErrorMessage({ detail: safeMsg }, 422, 'Unprocessable Entity');
    assert.ok(formatted.includes(safeMsg), `Over-sanitized safe message "${safeMsg}" -> "${formatted}"`);
    assert.equal(getErrorMessage(new Error(safeMsg), 'Safe fallback'), safeMsg);
  }

  // Array validation with mixed safe + leaky entries preserves safe and drops leaky
  assert.equal(
    formatApiErrorDetail([
      { msg: 'Text field is required' },
      { msg: 'Bad file /home/user/data.json' },
    ]),
    'Text field is required'
  );
});

test('AUD-M1-02-R1: error sanitization covers Windows forward/backslash paths and container workspace paths without over-sanitizing safe text', () => {
  const { extractApiErrorMessage, getErrorMessage, formatApiErrorDetail, sanitizeNetworkErrorMessage } =
    apiErrorMod;

  const leakyInputs = [
    { label: 'Windows forward-slash D:', msg: 'Failed reading D:/files/project/mirah.db', token: 'D:/files' },
    { label: 'Windows forward-slash lowercase c:', msg: 'Permission denied on (c:/users/dev/.env)', token: 'c:/users' },
    { label: 'Windows quoted forward-slash C:', msg: 'Cannot open "C:/Windows/System32/drivers/etc/hosts"', token: 'C:/Windows' },
    { label: 'Windows file URI', msg: 'Error loading file:///D:/files/OneDrive/secrets.json', token: 'D:/files' },
    { label: 'Windows backslash path', msg: 'Failed reading D:\\files\\project\\mirah.db', token: 'D:\\files' },
    { label: 'Windows UNC backslash path', msg: 'Access denied on \\\\fileserver\\private\\audits\\report.md', token: '\\\\fileserver' },
    { label: 'Container /workspace/ path', msg: 'Crash inside /workspace/mira_h/apps/api/main.py line 42', token: '/workspace/' },
    { label: 'Container /workspaces/ path', msg: 'Failed in /workspaces/mira-h/config/settings.py', token: '/workspaces/' },
    { label: 'Container /code/ path', msg: 'Unhandled error at /code/app/services/session_service.py', token: '/code/' },
    { label: 'Existing /app/ path', msg: 'Failed in /app/app/main.py', token: '/app/' },
    { label: 'Existing /home/ path', msg: 'Key error in /home/runner/key.pem', token: '/home/' },
    { label: 'Existing /usr/ path', msg: 'Missing /usr/local/bin/python3', token: '/usr/' },
    { label: 'Existing /var/ path', msg: 'Write failed at /var/log/api.log', token: '/var/' },
    { label: 'Existing /etc/ path', msg: 'Cannot read /etc/ssl/private.key', token: '/etc/' },
    { label: 'Existing /tmp/ path', msg: 'Temp failure at /tmp/upload_123.wav', token: '/tmp/' },
    { label: 'Existing /opt/ path', msg: 'Binary missing at /opt/venv/bin/uvicorn', token: '/opt/' },
    { label: 'Existing /srv/ path', msg: 'Service root error at /srv/mira/app.py', token: '/srv/' },
    { label: 'Existing /mnt/ path', msg: 'Volume missing at /mnt/data/weights.pt', token: '/mnt/' },
    { label: 'Existing /root/ path', msg: 'Cache error at /root/.cache/torch', token: '/root/' },
    { label: 'Existing /private/ path', msg: 'Lock error at /private/var/tmp/lock', token: '/private/' },
    { label: 'Existing /Users/ path', msg: 'Profile error at /Users/dev/Desktop/MIRA_H', token: '/Users/' },
  ];

  for (const item of leakyInputs) {
    const apiErr = extractApiErrorMessage({ detail: item.msg }, 422, 'Unprocessable Entity');
    assert.ok(!apiErr.includes(item.token), `${item.label} leaked via 422 detail: ${apiErr}`);
    assert.match(apiErr, /HTTP 422/);

    const genericErr = getErrorMessage(new Error(item.msg), 'Safe fallback');
    assert.equal(genericErr, 'Safe fallback', `${item.label} leaked via getErrorMessage: ${genericErr}`);

    const networkErr = sanitizeNetworkErrorMessage(new Error(item.msg));
    assert.ok(!networkErr.includes(item.token), `${item.label} leaked via sanitizeNetworkErrorMessage: ${networkErr}`);
  }

  // Structured validation details containing sensitive paths
  assert.equal(
    extractApiErrorMessage(
      { detail: { path: 'D:/files/project/config.json', hint: 'Invalid syntax' } },
      422,
      'Unprocessable Entity'
    ),
    'API Error (HTTP 422 Unprocessable Entity).'
  );
  assert.equal(
    extractApiErrorMessage(
      { detail: { file: '/workspace/secret.env', line: 7 } },
      400,
      'Bad Request'
    ),
    'API Error (HTTP 400 Bad Request).'
  );
  assert.equal(
    extractApiErrorMessage(
      { error: { message: 'Module missing at /code/ml/adapter.py' } },
      400,
      'Bad Request'
    ),
    'API Error (HTTP 400 Bad Request).'
  );
  assert.equal(
    formatApiErrorDetail([
      { loc: ['body', 'text'], msg: 'Input invalid at C:/workspace/input.txt' },
      { loc: ['body', 'lang'], msg: 'Supported languages are ISL/ASL and English/Hindi.' },
      { loc: ['body', 'env'], msg: 'Failure in /code/runtime/env.py' },
    ]),
    'Supported languages are ISL/ASL and English/Hindi.'
  );

  // Legitimate API paths, URLs, language pairs, and ordinary validation errors MUST remain intact
  const safeMessages = [
    'Supported sign languages are ISL/ASL and English/Hindi.',
    'Validation failed for endpoint /api/v1/sessions.',
    'Invalid payload for /api/v1/sign/generate.',
    'See local API endpoint http://localhost:8000/api/v1/health or https://example.com/docs.',
    'Endpoint:/api/v1/sessions returned empty payload.',
    "Session 'sess-42' not found.",
    'Input text must be between 1 and 500 characters.',
  ];
  for (const safeMsg of safeMessages) {
    const out = extractApiErrorMessage({ detail: safeMsg }, 422, 'Unprocessable Entity');
    assert.ok(out.includes(safeMsg), `Over-sanitized "${safeMsg}" -> "${out}"`);
    assert.equal(getErrorMessage(new Error(safeMsg), 'Safe fallback'), safeMsg);
  }
});

test('AUD-M1-03: ApiClient keeps timeout active through body consumption, clears timers cleanly, and aborts hung streams', async (t) => {
  const ApiClientCtor = (apiMod as unknown as { ApiClient?: new (opts?: { timeoutMs?: number }) => typeof apiMod.apiClient }).ApiClient;
  assert.ok(typeof ApiClientCtor === 'function', 'ApiClient class must be exported for timeout configuration/testing');

  const client = new ApiClientCtor({ timeoutMs: 40 });
  const originalFetch = globalThis.fetch;
  const originalSetTimeout = globalThis.setTimeout;
  const originalClearTimeout = globalThis.clearTimeout;

  let activeTimers = 0;
  let clearedTimers = 0;
  let firedTimers = 0;
  const liveIds = new Set<ReturnType<typeof setTimeout>>();

  t.after(() => {
    globalThis.fetch = originalFetch;
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
  });

  const installTimerSpy = () => {
    activeTimers = 0;
    clearedTimers = 0;
    firedTimers = 0;
    liveIds.clear();
    globalThis.setTimeout = ((fn: (...args: unknown[]) => void, ms?: number, ...args: unknown[]) => {
      const id = originalSetTimeout(() => {
        liveIds.delete(id);
        firedTimers += 1;
        fn(...args);
      }, ms);
      liveIds.add(id);
      activeTimers += 1;
      return id;
    }) as typeof setTimeout;
    globalThis.clearTimeout = ((id: ReturnType<typeof setTimeout> | undefined) => {
      if (id !== undefined && liveIds.has(id)) {
        liveIds.delete(id);
        clearedTimers += 1;
      }
      originalClearTimeout(id);
    }) as typeof clearTimeout;
  };

  // 1. Slow body resolving just before timeout (15ms < 40ms) succeeds & clears timer
  installTimerSpy();
  globalThis.fetch = async (_url, init) =>
    createAbortAwareBodyResponse({
      ok: true,
      status: 200,
      statusText: 'OK',
      delayMs: 15,
      signal: init?.signal ?? undefined,
      bodyText: JSON.stringify({
        success: true,
        correlation_id: 'c-body-ok',
        timestamp: '2026-11-27T00:00:00Z',
        data: { status: 'healthy', service: 'mira-h-api', version: '2.0.0' },
      }),
    });
  const okRes = await client.getHealth();
  assert.equal(okRes.status, 'healthy');
  assert.ok(activeTimers >= 1);
  assert.ok(clearedTimers >= 1, 'ApiClient timeout timer must be explicitly cleared via clearTimeout');
  assert.equal(clearedTimers + firedTimers, activeTimers, 'Every scheduled timer must either clear or complete');
  assert.equal(liveIds.size, 0, 'Timeout timer leaked after delayed body success');

  // 2. Abort-aware body exceeding timeout (120ms > 40ms) aborts during body read
  globalThis.setTimeout = originalSetTimeout;
  globalThis.clearTimeout = originalClearTimeout;
  globalThis.fetch = async (_url, init) =>
    createAbortAwareBodyResponse({
      ok: true,
      status: 200,
      statusText: 'OK',
      delayMs: 120,
      signal: init?.signal ?? undefined,
      bodyText: '{"success":true,"data":{}}',
    });
  await assert.rejects(() => client.getHealth(), /timed out after 40ms/i);

  // 3. Hung body ignoring AbortSignal still rejects at timeout instead of hanging indefinitely
  globalThis.fetch = async () =>
    createHungBodyResponse({ ok: true, status: 200, statusText: 'OK' });
  await assert.rejects(() => client.getHealth(), /timed out after 40ms/i);

  // 4. Cleanup timer after parse error and HTTP 500 error
  installTimerSpy();
  globalThis.fetch = async () =>
    createAbortAwareBodyResponse({
      ok: true,
      status: 200,
      statusText: 'OK',
      delayMs: 5,
      bodyText: '{invalid json',
    });
  await assert.rejects(() => client.getHealth(), /malformed JSON/i);
  assert.equal(liveIds.size, 0, 'Timeout timer leaked after malformed JSON');
  assert.ok(clearedTimers >= 1);

  installTimerSpy();
  globalThis.fetch = async () =>
    createAbortAwareBodyResponse({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      delayMs: 5,
      bodyText: '{"error":{"message":"sqlite3 secret"}}',
    });
  await assert.rejects(() => client.getHealth(), /HTTP 500/);
  assert.equal(liveIds.size, 0, 'Timeout timer leaked after 500 error');
});

test('AUD-M1-01: Sign-to-Speech async lifecycle guards camera stop, stale responses, unmount, local notices, and errors', async () => {
  const lifecycleMod = require('./signToSpeechLifecycle.ts') as typeof import('./signToSpeechLifecycle');

  assert.equal(lifecycleMod.isLocalSessionId('local-123'), true);
  assert.equal(lifecycleMod.isLocalSessionId('remote-uuid'), false);

  const terminatedIds: string[] = [];
  let stateUpdates = 0;
  const recordTerminated = async (id: string): Promise<Record<string, unknown>> => {
    terminatedIds.push(id);
    return {};
  };

  function deferred<T>() {
    let resolve!: (v: T) => void;
    let reject!: (e: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  }

  type PredictResult = Awaited<ReturnType<import('./signToSpeechLifecycle').SignToSpeechApiDeps['predictSign']>>;
  type TranslateResult = Awaited<ReturnType<import('./signToSpeechLifecycle').SignToSpeechApiDeps['translateGloss']>>;
  type VisionFrame = import('../types').VisionFramePayload;

  const dummyFrame = (seq: number): VisionFrame => ({
    session_id: 's',
    timestamp_ms: seq * 100,
    frame_sequence: seq,
    image_width: 640,
    image_height: 480,
    hands: [],
  });

  // Case A: Local fallback preserves notice across translateGloss success & skips terminateSession for local- ID
  const createDef = deferred<{ session_id: string }>();
  const pred1Def = deferred<PredictResult>();
  const trans1Def = deferred<TranslateResult>();

  const lc = lifecycleMod.createSignToSpeechLifecycle({
    api: {
      createSession: () => createDef.promise,
      terminateSession: recordTerminated,
      predictSign: () => pred1Def.promise,
      translateGloss: () => trans1Def.promise,
    },
    onSnapshot: () => {
      stateUpdates += 1;
    },
    now: () => 1700000000000,
  });

  const startPromise = lc.startSession({ signLanguage: 'ISL', spokenLanguage: 'EN' });
  createDef.reject(new Error('API unreachable'));
  await startPromise;
  assert.equal(lc.getSnapshot().sessionId, 'local-1700000000000');
  assert.match(String(lc.getSnapshot().sessionNotice), /local preview/i);

  for (let i = 0; i < 4; i += 1) {
    await lc.enqueueAndMaybePredict(dummyFrame(i), { signLanguage: 'ISL', spokenLanguage: 'EN', nowMs: 100 });
  }
  const predPromise = lc.enqueueAndMaybePredict(dummyFrame(5), { signLanguage: 'ISL', spokenLanguage: 'EN', nowMs: 1000 });
  pred1Def.resolve({
    request_id: 'r1',
    session_id: 'local-1700000000000',
    sign_language: 'ISL',
    status: 'prediction_available',
    top_prediction: { gloss: 'HELLO', display_text: 'Hello', confidence: 0.9, uncertainty: 0.1 },
    candidates: [{ gloss: 'HELLO', display_text: 'Hello', confidence: 0.9, uncertainty: 0.1 }],
    model_name: 'isl-geometric-heuristic-v1',
    model_version: '1.0.0',
    processing_duration_ms: 12.5,
    timestamp: '2026-11-27T00:00:00Z',
  });
  trans1Def.resolve({
    source_glosses: ['HELLO'],
    target_language: 'EN',
    translated_text: 'Hello, how are you?',
    confidence: 0.9,
    evidence_grounded: true,
    correction_notes: 'ok',
    timestamp: '2026-11-27T00:00:00Z',
  });
  await predPromise;
  assert.equal(lc.getSnapshot().topPrediction?.gloss, 'HELLO');
  assert.equal(lc.getSnapshot().translation?.translated_text, 'Hello, how are you?');
  assert.match(String(lc.getSnapshot().sessionNotice), /local preview/i, 'Successful translation MUST NOT clear local-session notice');

  lc.stopSession();
  assert.equal(terminatedIds.length, 0);
  assert.equal(lc.getSnapshot().sessionId, '');
  assert.equal(lc.getSnapshot().topPrediction, null);
  assert.equal(lc.getSnapshot().translation, null);
  assert.equal(lc.getSnapshot().predictionStatus, 'not_processed');
  assert.equal(lc.getSnapshot().sessionNotice, null);

  // Case B: Stale prediction #1 cannot overwrite prediction #2, rejected translate sets notice & clears stale translation,
  // and terminating a remote session hits terminateSession once.
  const predA = deferred<PredictResult>();
  const predB = deferred<PredictResult>();
  const transFail = deferred<TranslateResult>();
  let callIdx = 0;

  const lc2 = lifecycleMod.createSignToSpeechLifecycle({
    api: {
      createSession: async () => ({ session_id: 'remote-session-1' }),
      terminateSession: recordTerminated,
      predictSign: () => (++callIdx === 1 ? predA.promise : predB.promise),
      translateGloss: () => transFail.promise,
    },
    onSnapshot: () => {
      stateUpdates += 1;
    },
    now: () => 1700000000001,
  });

  await lc2.startSession({ signLanguage: 'ASL', spokenLanguage: 'EN' });
  assert.equal(lc2.getSnapshot().sessionId, 'remote-session-1');

  for (let i = 0; i < 4; i += 1) {
    await lc2.enqueueAndMaybePredict(dummyFrame(i), { signLanguage: 'ASL', spokenLanguage: 'EN', nowMs: 100 });
  }
  const pSlow = lc2.enqueueAndMaybePredict(dummyFrame(5), { signLanguage: 'ASL', spokenLanguage: 'EN', nowMs: 1000 });
  const pFast = lc2.enqueueAndMaybePredict(dummyFrame(6), { signLanguage: 'ASL', spokenLanguage: 'EN', nowMs: 1600 });

  predB.resolve({
    request_id: 'rB',
    session_id: 'remote-session-1',
    sign_language: 'ASL',
    status: 'prediction_available',
    top_prediction: { gloss: 'THANK_YOU', display_text: 'Thank You', confidence: 0.88, uncertainty: 0.12 },
    candidates: [],
    model_name: 'asl-geometric-heuristic-v1',
    model_version: '1.0.0',
    processing_duration_ms: 8.0,
    timestamp: '2026-11-27T00:00:00Z',
  });
  transFail.reject(new Error('Translation unavailable (HTTP 503 Service Unavailable)'));
  await pFast;

  assert.equal(lc2.getSnapshot().topPrediction?.gloss, 'THANK_YOU');
  assert.equal(lc2.getSnapshot().translation, null);
  assert.match(String(lc2.getSnapshot().translationNotice), /HTTP 503/);

  predA.resolve({
    request_id: 'rA',
    session_id: 'remote-session-1',
    sign_language: 'ASL',
    status: 'prediction_available',
    top_prediction: { gloss: 'STALE_OLD', display_text: 'Old', confidence: 0.7, uncertainty: 0.3 },
    candidates: [],
    model_name: 'asl-geometric-heuristic-v1',
    model_version: '1.0.0',
    processing_duration_ms: 99.0,
    timestamp: '2026-11-27T00:00:00Z',
  });
  await pSlow;
  assert.equal(lc2.getSnapshot().topPrediction?.gloss, 'THANK_YOU');

  lc2.stopSession();
  assert.deepEqual(terminatedIds, ['remote-session-1']);
  assert.equal(lc2.getSnapshot().topPrediction, null);

  // Case C: Unmount mid-flight blocks any further onSnapshot emission
  const preUnmountUpdates = stateUpdates;
  const hungCreate = deferred<{ session_id: string }>();
  const lc3 = lifecycleMod.createSignToSpeechLifecycle({
    api: {
      createSession: () => hungCreate.promise,
      terminateSession: recordTerminated,
      predictSign: async () => {
        throw new Error('Should not resolve');
      },
      translateGloss: async () => {
        throw new Error('Should not resolve');
      },
    },
    onSnapshot: () => {
      stateUpdates += 1;
    },
    now: () => 1700000000002,
  });
  const pendingStart = lc3.startSession({ signLanguage: 'ISL', spokenLanguage: 'HI' });
  lc3.unmount();
  const afterUnmountUpdates = stateUpdates;
  hungCreate.resolve({ session_id: 'remote-late-after-unmount' });
  await pendingStart;
  assert.equal(afterUnmountUpdates, preUnmountUpdates + 1);
  assert.equal(stateUpdates, afterUnmountUpdates, 'Zero state updates allowed after unmount');

  // Case D: StrictMode remount + camera stop mid-inference + rejected predictSign/terminateSession handling
  let stopTermFail = true;
  const inflightPredAfterStop = deferred<PredictResult>();
  let modeCall = 0;
  const lcStrict = lifecycleMod.createSignToSpeechLifecycle({
    api: {
      createSession: async () => ({ session_id: 'remote-strict-1' }),
      terminateSession: async () => {
        if (stopTermFail) {
          throw new Error('Cleanup timeout (HTTP 504)');
        }
        return {};
      },
      predictSign: () => {
        modeCall += 1;
        if (modeCall === 1) {
          return inflightPredAfterStop.promise;
        }
        return Promise.reject(new Error('Inference backend unavailable (HTTP 503)'));
      },
      translateGloss: async () => {
        throw new Error('Should not be called after stop');
      },
    },
    onSnapshot: () => {
      stateUpdates += 1;
    },
    now: () => 1700000000003,
  });

  lcStrict.unmount();
  lcStrict.mount();
  await lcStrict.startSession({ signLanguage: 'ISL', spokenLanguage: 'EN' });
  assert.equal(lcStrict.getSnapshot().sessionId, 'remote-strict-1');

  for (let i = 0; i < 4; i += 1) {
    await lcStrict.enqueueAndMaybePredict(dummyFrame(i), { signLanguage: 'ISL', spokenLanguage: 'EN', nowMs: 100 });
  }
  const stoppedMidFlight = lcStrict.enqueueAndMaybePredict(dummyFrame(5), { signLanguage: 'ISL', spokenLanguage: 'EN', nowMs: 1000 });
  lcStrict.stopSession();
  inflightPredAfterStop.resolve({
    request_id: 'r-after-stop',
    session_id: 'remote-strict-1',
    sign_language: 'ISL',
    status: 'prediction_available',
    top_prediction: { gloss: 'AFTER_STOP', display_text: 'After Stop', confidence: 0.99, uncertainty: 0.01 },
    candidates: [],
    model_name: 'isl-geometric-heuristic-v1',
    model_version: '1.0.0',
    processing_duration_ms: 5,
    timestamp: '2026-11-27T00:00:00Z',
  });
  await stoppedMidFlight;
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(lcStrict.getSnapshot().topPrediction, null, 'Prediction resolving after stopSession must not mutate state');
  assert.equal(lcStrict.getSnapshot().translation, null);
  assert.equal(lcStrict.getSnapshot().isProcessingRequest, false);
  assert.match(String(lcStrict.getSnapshot().sessionNotice), /HTTP 504/);

  stopTermFail = false;
  await lcStrict.startSession({ signLanguage: 'ISL', spokenLanguage: 'EN' });
  assert.equal(lcStrict.getSnapshot().sessionNotice, null);
  for (let i = 0; i < 4; i += 1) {
    await lcStrict.enqueueAndMaybePredict(dummyFrame(i), { signLanguage: 'ISL', spokenLanguage: 'EN', nowMs: 100 });
  }
  await lcStrict.enqueueAndMaybePredict(dummyFrame(5), { signLanguage: 'ISL', spokenLanguage: 'EN', nowMs: 1000 });
  assert.equal(lcStrict.getSnapshot().predictionStatus, 'processing_failure');
  assert.equal(lcStrict.getSnapshot().isProcessingRequest, false);
  assert.match(String(lcStrict.getSnapshot().translationNotice), /HTTP 503/);
});
