import pino from 'pino';
import { env } from './env';

const isProd = env.NODE_ENV === 'production';

/**
 * Central structured logger for the gateway (Phase 1 observability).
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
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
  base: { service: 'api-gateway' },
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
