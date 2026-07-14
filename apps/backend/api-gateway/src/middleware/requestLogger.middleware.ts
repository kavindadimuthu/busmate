import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';
import { logger } from '../config/logger';

/**
 * Request logging + correlation-ID middleware (Phase 1 observability).
 *
 * Replaces the old plain-text `morgan('combined')`. For every request it:
 *   - reuses an inbound `X-Request-Id` or mints a UUID,
 *   - writes it back onto `req.headers['x-request-id']` so the downstream proxy
 *     forwards it to the Spring services (which pick it up into their SLF4J MDC),
 *   - echoes it on the response as `X-Request-Id`, and
 *   - stamps every log line for the request with a `requestId` field.
 *
 * This is the single thread that lets one Loki query follow a request across the
 * gateway and all three backend services.
 */
export const requestLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const incoming = req.headers['x-request-id'];
    const requestId = (Array.isArray(incoming) ? incoming[0] : incoming) || randomUUID();
    // Ensure it is forwarded downstream by http-proxy-middleware (which relays the
    // incoming header set) and visible to the caller.
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-Id', requestId);
    return requestId;
  },
  customProps: (req) => ({ requestId: (req as { id?: string }).id }),
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
});
