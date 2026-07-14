import client from 'prom-client';
import { Request, Response, NextFunction } from 'express';

/**
 * Prometheus metrics for the gateway (Phase 3 observability).
 *
 * Exposes the four golden signals for the public entry point:
 *   - default Node/process metrics (event-loop lag, heap, GC, handles) via collectDefaultMetrics
 *   - http_request_duration_seconds (histogram) → rate, errors, p95/p99 latency
 *   - http_requests_total (counter)
 *
 * Route labels are normalised (numeric / UUID path segments collapse to `:id`, capped at
 * four segments) so cardinality stays bounded — never label by a raw URL.
 */
export const register = new client.Registry();
register.setDefaultLabels({ service: 'api-gateway' });
client.collectDefaultMetrics({ register });

const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

const httpTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeRoute(rawUrl: string): string {
  const path = rawUrl.split('?')[0];
  const segments = path
    .split('/')
    .filter(Boolean)
    .slice(0, 4)
    .map((seg) => (UUID_RE.test(seg) || /^\d+$/.test(seg) ? ':id' : seg));
  return '/' + segments.join('/');
}

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const stopTimer = httpDuration.startTimer();
  res.on('finish', () => {
    const labels = {
      method: req.method,
      route: normalizeRoute(req.originalUrl || req.url),
      status_code: String(res.statusCode),
    };
    stopTimer(labels);
    httpTotal.inc(labels);
  });
  next();
}

export async function metricsHandler(_req: Request, res: Response): Promise<void> {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}
