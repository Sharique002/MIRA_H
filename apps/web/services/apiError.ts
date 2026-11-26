export interface ConnectionIndicatorState {
  indicatorStatus: 'online' | 'offline' | 'busy';
  label: string;
}

export interface WebcamErrorResolution {
  denied: boolean;
  message: string;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const WINDOWS_PATH_RE =
  /(?:^|[^A-Za-z0-9_+.-]|file:\/\/\/?)[A-Za-z]:[\\/][^\s"']*|(?:^|[\s"'(=:,;[\]{}<>])\\\\[^\s\\]+\\[^\s\\]+/;
const UNIX_SENSITIVE_PATH_RE =
  /(?:^|[\s"'(=:,;[\]{}<>]|file:\/\/)\/(?:app|workspace|workspaces|code|workdir|home|users|usr|var|opt|etc|tmp|srv|mnt|root|private|bin|sbin|lib|proc|sys|dev)\/[^\s"']*/i;
const RUNTIME_TRACE_RE =
  /(traceback\s*\(most recent|file\s+"[^"]+"|sqlalchemy|sqlite3|psycopg2|node_modules|\s+at\s+[^\s(]+\s*\([^\s)]+:\d+)/i;

function containsInternalDetails(message: string): boolean {
  return (
    WINDOWS_PATH_RE.test(message) ||
    UNIX_SENSITIVE_PATH_RE.test(message) ||
    RUNTIME_TRACE_RE.test(message)
  );
}

function safeStringify(value: unknown): string | undefined {
  try {
    const serialized = JSON.stringify(value);
    if (!serialized || serialized === '{}' || serialized === '[]') {
      return undefined;
    }
    return serialized;
  } catch {
    return undefined;
  }
}

export function formatHttpStatusTag(status: number, statusText: string): string {
  const cleanText = statusText.trim();
  return cleanText.length > 0 ? `HTTP ${status} ${cleanText}` : `HTTP ${status}`;
}

/** Determine whether an unknown thrown value represents a request abort/timeout. */
export function isAbortError(err: unknown): boolean {
  if (err instanceof Error && err.name === 'AbortError') {
    return true;
  }
  return isRecord(err) && typeof err.name === 'string' && err.name === 'AbortError';
}

/** Extract a safe human-readable error message from an unknown thrown value. */
export function getErrorMessage(err: unknown, fallback: string): string {
  let candidate: string | null = null;
  if (err instanceof Error && err.message.trim().length > 0) {
    candidate = err.message.trim();
  } else if (typeof err === 'string' && err.trim().length > 0) {
    candidate = err.trim();
  } else if (isRecord(err) && typeof err.message === 'string' && err.message.trim().length > 0) {
    candidate = err.message.trim();
  }

  if (candidate && !containsInternalDetails(candidate)) {
    return candidate;
  }
  return fallback;
}

/** Sanitize unexpected fetch/network exceptions before surfacing to UI state. */
export function sanitizeNetworkErrorMessage(err: unknown): string {
  const fallback =
    'Unable to reach the backend API server. Verify that the API is running and accessible.';
  const raw = getErrorMessage(err, fallback);
  if (
    raw === fallback ||
    /failed to fetch|networkerror|load failed|fetch failed|econnrefused/i.test(raw)
  ) {
    return fallback;
  }
  return raw;
}

function formatDetailItem(item: unknown): string | undefined {
  if (typeof item === 'string') {
    const trimmed = item.trim();
    return trimmed.length > 0 && !containsInternalDetails(trimmed) ? trimmed : undefined;
  }
  if (isRecord(item)) {
    if (typeof item.msg === 'string' && item.msg.trim().length > 0) {
      const msg = item.msg.trim();
      return containsInternalDetails(msg) ? undefined : msg;
    }
    if (typeof item.message === 'string' && item.message.trim().length > 0) {
      const message = item.message.trim();
      return containsInternalDetails(message) ? undefined : message;
    }
    const serialized = safeStringify(item);
    return serialized && !containsInternalDetails(serialized) ? serialized : undefined;
  }
  if (typeof item === 'number' || typeof item === 'boolean') {
    return String(item);
  }
  return undefined;
}

/** Narrow FastAPI/envelope `detail` payloads (string, list, structured object, or empty). */
export function formatApiErrorDetail(detail: unknown): string | undefined {
  if (detail === null || detail === undefined) {
    return undefined;
  }
  if (Array.isArray(detail)) {
    const parts = detail
      .map((entry: unknown) => formatDetailItem(entry))
      .filter((msg): msg is string => typeof msg === 'string' && msg.length > 0);
    return parts.length > 0 ? parts.join('; ') : undefined;
  }
  return formatDetailItem(detail);
}

/** Validate and sanitize API error payloads while always preserving HTTP status metadata. */
export function extractApiErrorMessage(
  payload: unknown,
  status: number,
  statusText: string
): string {
  const httpTag = formatHttpStatusTag(status, statusText);

  // Never forward raw 5xx server exception details or internal traces to clients.
  if (status >= 500) {
    return `Backend service error (${httpTag}). Please retry or verify the API server.`;
  }

  if (isRecord(payload)) {
    let safeClientMsg: string | undefined;

    if (
      isRecord(payload.error) &&
      typeof payload.error.message === 'string' &&
      payload.error.message.trim().length > 0 &&
      !containsInternalDetails(payload.error.message)
    ) {
      safeClientMsg = payload.error.message.trim();
    } else {
      safeClientMsg = formatApiErrorDetail(payload.detail);
      if (
        !safeClientMsg &&
        typeof payload.message === 'string' &&
        payload.message.trim().length > 0 &&
        !containsInternalDetails(payload.message)
      ) {
        safeClientMsg = payload.message.trim();
      }
    }

    if (safeClientMsg) {
      return safeClientMsg.includes(`HTTP ${status}`)
        ? safeClientMsg
        : `${safeClientMsg} (${httpTag})`;
    }
  }

  return `API Error (${httpTag}).`;
}

/** Validate parsed ResponseEnvelope structure before callers access `.data`. */
export function validateResponseEnvelope(
  payload: unknown,
  status: number,
  statusText: string
): { valid: true; data: unknown } | { valid: false; errorMessage: string } {
  const httpTag = formatHttpStatusTag(status, statusText);

  if (!isRecord(payload) || typeof payload.success !== 'boolean') {
    return {
      valid: false,
      errorMessage: `Malformed API response envelope (${httpTag}).`,
    };
  }

  if (!payload.success) {
    return {
      valid: false,
      errorMessage: extractApiErrorMessage(payload, status, statusText),
    };
  }

  if (!('data' in payload) || payload.data === undefined || payload.data === null) {
    return {
      valid: false,
      errorMessage: `Malformed API response envelope: missing data payload (${httpTag}).`,
    };
  }

  return { valid: true, data: payload.data };
}

/** Map browser camera errors safely without leaking raw system/internal details. */
export function resolveWebcamError(err: unknown): WebcamErrorResolution {
  const errName =
    err instanceof Error
      ? err.name
      : isRecord(err) && typeof err.name === 'string'
      ? err.name
      : '';

  switch (errName) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return {
        denied: true,
        message:
          'Camera access was denied. Please grant camera permission in your browser address bar.',
      };
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return {
        denied: false,
        message: 'No camera device detected on this system.',
      };
    case 'NotReadableError':
    case 'TrackStartError':
      return {
        denied: false,
        message: 'Camera is in use by another application or could not be opened.',
      };
    case 'OverconstrainedError':
    case 'ConstraintNotSatisfiedError':
      return {
        denied: false,
        message: 'Selected camera does not support the requested video settings.',
      };
    case 'SecurityError':
      return {
        denied: true,
        message: 'Camera access requires a secure browser context (HTTPS or localhost).',
      };
    default:
      return {
        denied: false,
        message:
          'Unable to access camera hardware. Check browser permissions and device availability.',
      };
  }
}

/** Derive top-level Studio Hub connection status without getting stuck on "API Connecting". */
export function deriveConnectionStatus(params: {
  isLoading: boolean;
  hasData: boolean;
  error: string | null;
}): ConnectionIndicatorState {
  if (params.hasData) {
    return { indicatorStatus: 'online', label: 'API Ready' };
  }
  if (params.isLoading && !params.error) {
    return { indicatorStatus: 'busy', label: 'API Connecting' };
  }
  return { indicatorStatus: 'offline', label: 'API Unavailable' };
}
