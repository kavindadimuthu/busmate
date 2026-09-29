import * as Sentry from '@sentry/react';

/**
 * Same setup as passenger-web's lib/sentry.ts: disabled by default (no DSN), correlates
 * frontend errors with backend logs via the gateway's X-Request-Id header. See
 * config/observability/README.md.
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
