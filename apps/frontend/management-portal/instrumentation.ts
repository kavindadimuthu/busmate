import * as Sentry from '@sentry/nextjs';

/**
 * Phase 5 observability — server + edge runtime error tracking (Next.js App Router
 * convention: `register()` is called automatically by the framework on boot).
 *
 * Disabled by default: with no DSN, Sentry drops everything instead of sending it.
 * Set `SENTRY_DSN` (server-only, not the `NEXT_PUBLIC_` one used client-side) to
 * enable — see config/observability/README.md.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' || process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN || undefined,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
