import pino from 'pino';
import { trace } from '@opentelemetry/api';
import { env } from './env';

const isProd = env.NODE_ENV === 'production';

/**
 * Central structured logger for the gateway (Phase 1 + 6 observability).
 *
 * - Production: single-line JSON on stdout so Alloy/Promtail can ship it to Loki.
 *   `level` is emitted as an upper-case string (INFO/WARN/ERROR) to line up with the
 *   Spring services' Logback output, and `service` is a constant field so both stacks
 *   share the same log schema.
 * - Development: human-readable, colourised output via pino-pretty (a devDependency —
 *   never required at runtime in production).
 *
 * Redaction is enforced here, not by convention, so credentials never reach the log
 * pipeline even if a new call site forgets.
 *
 * `mixin` stamps `trace_id`/`span_id` from the active OpenTelemetry span (started by
 * ./tracing.ts's auto-instrumentation) onto every log line, using the same field names
 * the Spring services' logback MDC uses — that's what lets Grafana's Loki<->Tempo
 * derived-field link (config/observability/grafana/provisioning/datasources) work
 * identically for gateway logs and backend logs.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
  base: { service: 'api-gateway' },
  mixin() {
    const span = trace.getActiveSpan();
    if (!span) return {};
    const { traceId, spanId } = span.spanContext();
    return { trace_id: traceId, span_id: spanId };
  },
  formatters: {
    // Emit the textual level (default pino uses the numeric value) and upper-case it
    // to match Logback's `INFO`/`WARN`/`ERROR`, keeping the `level` label consistent
    // across services in Loki.
    level: (label) => ({ level: label.toUpperCase() }),
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      'password',
      '*.password',
      'token',
      '*.token',
    ],
    censor: '[REDACTED]',
  },
  ...(isProd
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
        },
      }),
});
