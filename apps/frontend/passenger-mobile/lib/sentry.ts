import * as Sentry from '@sentry/react-native';

/**
 * Phase 5 observability — error tracking for the passenger mobile app.
 *
 * Disabled by default: with no DSN configured, `Sentry.init` still runs (so
 * `Sentry.captureException` never throws) but the SDK drops everything instead of
 * sending it. Set `EXPO_PUBLIC_SENTRY_DSN` to enable real reporting — see
 * config/observability/README.md.
 *
 * Correlates app errors with backend logs: every fetch response's `X-Request-Id`
 * header (set by the API gateway) is captured and attached to the next Sentry event,
 * so a Sentry issue can be traced to the exact request in Grafana Loki via
 * `{job="docker"} | json | requestId="<id>"`.
 */

let lastRequestId: string | undefined;

function instrumentFetchForRequestId(): void {
  const originalFetch = global.fetch;
  global.fetch = async (...args: Parameters<typeof fetch>) => {
    const response = await originalFetch(...args);
    const requestId = response.headers.get('x-request-id');
    if (requestId) lastRequestId = requestId;
    return response;
  };
}

export function initSentry(): void {
  instrumentFetchForRequestId();

  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || undefined,
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: __DEV__ ? 1.0 : 0.1,
    beforeSend(event) {
      if (lastRequestId) {
        event.tags = { ...event.tags, request_id: lastRequestId };
      }
      return event;
    },
  });
}
