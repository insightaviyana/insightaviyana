/**
 * Lightweight production error monitoring — Quick Win #5 from
 * ENGINEERING_ASSESSMENT.md ("No error/crash monitoring in production").
 *
 * Deliberately implemented as a small hand-rolled reporter against Sentry's
 * plain HTTP ingestion API instead of pulling in the full `@sentry/react`
 * SDK: this environment can't run `npm install` to vet a new dependency
 * against the rest of the toolchain, and a few dozen lines of fetch() are
 * enough to get real crash visibility (event, message, stack, URL, user
 * agent) without adding build risk. If the team later wants breadcrumbs,
 * session replay, or performance tracing, swapping this for the real SDK is
 * a drop-in replacement — every call site here (`captureException`) can
 * stay exactly as it is.
 *
 * Configuration: set VITE_SENTRY_DSN in .env to a real Sentry DSN
 * (Settings → Client Keys (DSN) on any Sentry project — free tier is
 * plenty for a site this size). Nothing is sent if it's unset, so this is
 * a total no-op in local dev unless explicitly configured.
 */

interface ParsedDsn {
  ingestUrl: string;
  publicKey: string;
}

function parseDsn(dsn: string): ParsedDsn | null {
  try {
    const url = new URL(dsn);
    const publicKey = url.username;
    const projectId = url.pathname.replace(/^\//, '');
    if (!publicKey || !projectId) return null;
    const ingestUrl = `${url.protocol}//${url.host}/api/${projectId}/store/?sentry_version=7&sentry_key=${publicKey}`;
    return { ingestUrl, publicKey };
  } catch {
    return null;
  }
}

let parsedDsn: ParsedDsn | null = null;
let initialized = false;

function send(payload: Record<string, unknown>) {
  if (!parsedDsn) return;
  try {
    // navigator.sendBeacon is best-effort and won't block page unload, but
    // falls back to fetch (keepalive) for environments without it.
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(parsedDsn.ingestUrl, new Blob([body], { type: 'application/json' }));
    } else {
      fetch(parsedDsn.ingestUrl, { method: 'POST', body, keepalive: true }).catch(() => {});
    }
  } catch {
    // Monitoring must never itself crash the app — swallow silently.
  }
}

function buildEvent(error: Error, extra?: Record<string, unknown>) {
  return {
    event_id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: new Date().toISOString(),
    level: 'error',
    logger: 'aviyana-insight',
    platform: 'javascript',
    environment: import.meta.env.MODE,
    release: (import.meta as { env?: { VITE_APP_VERSION?: string } }).env?.VITE_APP_VERSION || 'unversioned',
    request: { url: window.location.href, headers: { 'User-Agent': navigator.userAgent } },
    exception: {
      values: [
        {
          type: error.name || 'Error',
          value: error.message || String(error),
          stacktrace: error.stack ? { raw: error.stack } : undefined,
        },
      ],
    },
    extra,
  };
}

/** Manually report a caught error (e.g. from ErrorBoundary or a try/catch around a risky operation). */
export function captureException(error: unknown, extra?: Record<string, unknown>) {
  if (!parsedDsn) return;
  const err = error instanceof Error ? error : new Error(String(error));
  send(buildEvent(err, extra));
}

/**
 * Call once at app startup. Sets up global handlers so an uncaught error or
 * unhandled promise rejection anywhere in the app is reported automatically
 * — this is the exact gap the assessment flagged: "if something breaks in
 * front of a journalist mid-research, nobody at Aviyana finds out unless
 * that journalist reports it."
 */
export function initMonitoring() {
  if (initialized) return;
  initialized = true;

  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) {
    console.info('[monitoring] VITE_SENTRY_DSN not set — error reporting disabled (dev/local default).');
    return;
  }
  parsedDsn = parseDsn(dsn);
  if (!parsedDsn) {
    console.warn('[monitoring] VITE_SENTRY_DSN is set but could not be parsed — check the DSN format.');
    return;
  }

  window.addEventListener('error', (event) => {
    if (event.error instanceof Error) captureException(event.error, { source: 'window.onerror' });
  });
  window.addEventListener('unhandledrejection', (event) => {
    captureException(event.reason, { source: 'unhandledrejection' });
  });
}
