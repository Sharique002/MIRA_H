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
const speechMod = require('./speechRecognition.ts') as typeof import('./speechRecognition');

const { apiClient } = apiMod;
const {
  deriveConnectionStatus,
  extractApiErrorMessage,
  formatApiErrorDetail,
  getErrorMessage,
  isAbortError,
} = apiErrorMod;

const {
  getSpeechRecognitionConstructor,
  formatSpeechRecognitionError,
} = speechMod;

function createMockResponse(params: {
  ok: boolean;
  status: number;
  statusText: string;
  bodyText: string;
}): Response {
  return {
    ok: params.ok,
    status: params.status,
    statusText: params.statusText,
    text: async () => params.bodyText,
  } as unknown as Response;
}

test('FND-M1-01: deriveConnectionStatus transitions cleanly across loading, failure, and recovery', () => {
  assert.deepEqual(
    deriveConnectionStatus({ isLoading: true, hasData: false, error: null }),
    { indicatorStatus: 'busy', label: 'API Connecting' }
  );

  assert.deepEqual(
    deriveConnectionStatus({ isLoading: false, hasData: false, error: 'Backend server error (HTTP 503)' }),
    { indicatorStatus: 'offline', label: 'API Unavailable' }
  );

  assert.deepEqual(
    deriveConnectionStatus({ isLoading: true, hasData: false, error: 'Timeout' }),
    { indicatorStatus: 'offline', label: 'API Unavailable' }
  );

  assert.deepEqual(
    deriveConnectionStatus({ isLoading: false, hasData: true, error: null }),
    { indicatorStatus: 'online', label: 'API Ready' }
  );
});

test('FND-M1-02: getSpeechRecognitionConstructor supports standard, webkit, and unsupported browsers + EN/HI locales', () => {
  class StandardSpeech {
    lang = 'en-US';
    continuous = false;
    interimResults = false;
    onstart = null;
    onend = null;
    onerror = null;
    onresult = null;
    start() {
      this.lang = 'en-US';
    }
  }

  class WebkitSpeech extends StandardSpeech {}

  assert.equal(getSpeechRecognitionConstructor(undefined), null);
  assert.equal(getSpeechRecognitionConstructor({}), null);
  assert.equal(
    getSpeechRecognitionConstructor({
      SpeechRecognition: StandardSpeech,
      webkitSpeechRecognition: WebkitSpeech,
    }),
    StandardSpeech
  );
  assert.equal(
    getSpeechRecognitionConstructor({ webkitSpeechRecognition: WebkitSpeech }),
    WebkitSpeech
  );

  assert.equal(
    (speechMod as { resolveSpeechRecognitionLocale?: (lang: 'EN' | 'HI') => string })
      .resolveSpeechRecognitionLocale?.('HI'),
    'hi-IN'
  );
  assert.equal(
    (speechMod as { resolveSpeechRecognitionLocale?: (lang: 'EN' | 'HI') => string })
      .resolveSpeechRecognitionLocale?.('EN'),
    'en-US'
  );
});

test('FND-M1-02: formatSpeechRecognitionError communicates errors safely without leaking internal paths', () => {
  assert.match(formatSpeechRecognitionError({ error: 'not-allowed' }), /permission/i);
  assert.match(formatSpeechRecognitionError({ error: 'service-not-allowed' }), /permission/i);
  assert.match(formatSpeechRecognitionError({ error: 'audio-capture' }), /microphone/i);
  assert.match(formatSpeechRecognitionError({ error: 'no-speech' }), /No speech/i);
  assert.match(formatSpeechRecognitionError({ error: 'network' }), /offline/i);
  assert.match(formatSpeechRecognitionError(new DOMException('Denied', 'NotAllowedError')), /permission/i);

  const leaky = new Error('Internal driver failure at C:\\Users\\secret\\audio.dll');
  const formatted = formatSpeechRecognitionError(leaky);
  assert.ok(!formatted.includes('C:\\Users\\secret'), `Should not leak internal path: ${formatted}`);
});

test('FND-M1-03: ApiClient validates response shapes, preserves HTTP status, handles malformed/non-JSON, and hides 5xx internals', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  // 1. Valid 200 envelope succeeds
  globalThis.fetch = async () =>
    createMockResponse({
      ok: true,
      status: 200,
      statusText: 'OK',
      bodyText: JSON.stringify({
        success: true,
        correlation_id: 'c1',
        timestamp: '2026-11-27T00:00:00Z',
        data: { status: 'healthy', service: 'mira-h-api', version: '2.0.0' },
      }),
    });
  const health = await apiClient.getHealth();
  assert.equal(health.status, 'healthy');

  // 2. 200 OK with malformed non-envelope JSON shape is rejected cleanly
  globalThis.fetch = async () =>
    createMockResponse({
      ok: true,
      status: 200,
      statusText: 'OK',
      bodyText: JSON.stringify({ unexpected: 'shape' }),
    });
  await assert.rejects(() => apiClient.getHealth(), /HTTP 200/i);

  // 3. 200 OK with malformed JSON syntax is rejected cleanly without SyntaxError details
  globalThis.fetch = async () =>
    createMockResponse({
      ok: true,
      status: 200,
      statusText: 'OK',
      bodyText: '{bad json',
    });
  await assert.rejects(() => apiClient.getHealth(), /HTTP 200/i);

  // 4. 500 JSON leaking Python traceback / DB path MUST be sanitized while preserving HTTP 500
  globalThis.fetch = async () =>
    createMockResponse({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      bodyText: JSON.stringify({
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'sqlite3.OperationalError: no such table in C:\\secret\\mirah.db',
          details: 'OperationalError',
        },
        correlation_id: 'c500',
      }),
    });
  await assert.rejects(
    () => apiClient.getSystemStatus(),
    (err: unknown) => {
      assert.ok(err instanceof Error);
      assert.match(err.message, /HTTP 500/);
      assert.ok(!err.message.includes('sqlite3'), `Leaked internal exception: ${err.message}`);
      assert.ok(!err.message.includes('mirah.db'), `Leaked internal file path: ${err.message}`);
      return true;
    }
  );

  // 5. 502 HTML gateway body handles non-JSON response cleanly with HTTP 502 status
  globalThis.fetch = async () =>
    createMockResponse({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      bodyText: '<html><body>502 Bad Gateway internal nginx</body></html>',
    });
  await assert.rejects(
    () => apiClient.getHealth(),
    (err: unknown) => {
      assert.ok(err instanceof Error);
      assert.match(err.message, /HTTP 502/);
      assert.ok(!err.message.includes('<html>'), `Leaked raw HTML: ${err.message}`);
      return true;
    }
  );

  // 6. 422 FastAPI validation error preserves validation detail and HTTP 422 status
  globalThis.fetch = async () =>
    createMockResponse({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      bodyText: JSON.stringify({
        detail: [{ msg: 'Input text cannot be empty' }],
      }),
    });
  await assert.rejects(
    () => apiClient.getHealth(),
    (err: unknown) => {
      assert.ok(err instanceof Error);
      assert.match(err.message, /Input text cannot be empty/);
      assert.match(err.message, /HTTP 422/);
      return true;
    }
  );

  // 7. 200 OK with success=false envelope surfaces sanitized error with HTTP 200
  globalThis.fetch = async () =>
    createMockResponse({
      ok: true,
      status: 200,
      statusText: 'OK',
      bodyText: JSON.stringify({
        success: false,
        data: null,
        error: { code: 'ENGINE_OFFLINE', message: 'Engine offline' },
        correlation_id: 'c200f',
      }),
    });
  await assert.rejects(() => apiClient.getHealth(), /Engine offline.*HTTP 200/i);

  // 8. AbortError timeout normalized cleanly
  globalThis.fetch = async () => {
    throw new DOMException('Aborted', 'AbortError');
  };
  await assert.rejects(() => apiClient.getHealth(), /timed out after 10000ms/i);

  // 9. Network rejection with internal filesystem path is sanitized
  globalThis.fetch = async () => {
    throw new TypeError('connect ECONNREFUSED 127.0.0.1 C:\\secret\\socket');
  };
  await assert.rejects(
    () => apiClient.getHealth(),
    (err: unknown) => {
      assert.ok(err instanceof Error);
      assert.ok(!err.message.includes('C:\\secret'), `Leaked path: ${err.message}`);
      return true;
    }
  );
});

test('FND-M1-03: extractApiErrorMessage, formatApiErrorDetail, isAbortError, and resolveWebcamError narrow unknown safely', () => {
  assert.match(
    extractApiErrorMessage({ error: { message: 'Session expired' } }, 401, 'Unauthorized'),
    /Session expired.*HTTP 401/
  );
  assert.match(
    extractApiErrorMessage({ detail: 'Missing session' }, 404, 'Not Found'),
    /Missing session.*HTTP 404/
  );
  assert.equal(
    formatApiErrorDetail([
      { msg: 'Field required' },
      { msg: undefined },
      { msg: undefined, loc: ['body', 'text'] },
      { msg: '' },
    ]),
    'Field required; {"loc":["body","text"]}; {"msg":""}'
  );

  assert.equal(isAbortError({ name: 'AbortError' }), true);
  assert.equal(getErrorMessage({ message: 'Fallback check' }, 'default'), 'Fallback check');

  const webcamResolver = (
    apiErrorMod as {
      resolveWebcamError?: (err: unknown) => { denied: boolean; message: string };
    }
  ).resolveWebcamError;
  assert.ok(typeof webcamResolver === 'function', 'resolveWebcamError helper must exist');
  assert.deepEqual(webcamResolver(new DOMException('No perm', 'NotAllowedError')), {
    denied: true,
    message: 'Camera access was denied. Please grant camera permission in your browser address bar.',
  });
  assert.deepEqual(webcamResolver(new DOMException('Busy', 'NotReadableError')), {
    denied: false,
    message: 'Camera is in use by another application or could not be opened.',
  });
  const hardwareErr = webcamResolver(new Error('Internal driver panic at D:\\sys\\cam.sys'));
  assert.equal(hardwareErr.denied, false);
  assert.ok(!hardwareErr.message.includes('D:\\sys\\cam.sys'), `Leaked path: ${hardwareErr.message}`);
});
