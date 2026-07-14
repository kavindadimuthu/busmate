import * as Sentry from '@sentry/nextjs';

/**
 * Phase 5 observability — client-side error tracking (Next.js App Router convention:
 * this file's default export is picked up automatically, no explicit import needed).
 *
 * Disabled by default: with no DSN configured, `Sentry.init` still runs (so
 * `Sentry.captureException` never throws) but the SDK drops everything instead of
 * sending it. Set `NEXT_PUBLIC_SENTRY_DSN` to enable real reporting — see
 * config/observability/README.md.
 *
 * Correlates frontend errors with backend logs: every fetch response's
 * `X-Request-Id` header (set by the API gateway) is captured and attached to the next
 * Sentry event, so a Sentry issue can be traced to the exact request in Grafana Loki
 * via `{job="docker"} | json | requestId="<id>"`.
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

instrumentFetchForRequestId();

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || undefined,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  beforeSend(event) {
    if (lastRequestId) {
      event.tags = { ...event.tags, request_id: lastRequestId };
    }
    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
