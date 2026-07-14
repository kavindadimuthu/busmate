import * as Sentry from '@sentry/react';

/**
 * Phase 5 observability — frontend error tracking.
 *
 * Disabled by default: with no DSN configured, `Sentry.init` still runs (so call
 * sites like `Sentry.captureException` never throw) but the SDK drops everything
 * instead of sending it. Set `VITE_SENTRY_DSN` to enable real reporting — see
 * config/observability/README.md.
 *
 * Correlates frontend errors with backend logs: every fetch response's
 * `X-Request-Id` header (set by the API gateway, see RequestIdFilter on the backend)
 * is captured and attached to the next Sentry event, so a Sentry issue can be traced
 * to the exact request in Grafana Loki via `{job="docker"} | json | requestId="<id>"`.
 */

let lastRequestId: string | undefined;

function instrumentFetchForRequestId(): void {
  const originalFetch = window.fetch;
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const response = await originalFetch(...args);
    const requestId = response.headers.get('x-request-id');
    if (requestId) lastRequestId = requestId;
    return response;
  };
}

export function initSentry(): void {
  instrumentFetchForRequestId();

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN || undefined,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    beforeSend(event) {
      if (lastRequestId) {
        event.tags = { ...event.tags, request_id: lastRequestId };
      }
      return event;
    },
  });
}
