import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { env } from '../config/env';
import { logger } from '../config/logger';

const serviceUrls: Record<string, string> = {
  USER_SERVICE: env.USER_SERVICE_URL,
  CORE_SERVICE: env.CORE_SERVICE_URL,
  TICKETING: env.TICKETING_SERVICE_URL,
  TELEMETRY: env.TELEMETRY_SERVICE_URL,
};

export function createProxy(serviceName: string, pathFilter: string) {
  const target = serviceUrls[serviceName];
  if (!target) throw new Error(`Unknown service: ${serviceName}`);

  const options: Options = {
    target,
    changeOrigin: true,
    // Mounted at the app root (see app.ts) and filtered here instead of via
    // Express's app.use(path, ...) — Express strips a matched mount path from
    // req.url before the middleware runs, which would forward exact-match
    // routes (e.g. /api/auth/login) to the upstream's bare "/" instead of the
    // real path. pathFilter matches without touching req.url.
    pathFilter,
    on: {
      error: (err, req, res: any) => {
        logger.error(
          { err, service: serviceName, requestId: (req as { id?: string }).id },
          `Proxy error reaching ${serviceName}`,
        );
        res.status(502).json({ error: { code: 'SERVICE_UNAVAILABLE', message: `${serviceName} is unavailable` } });
      },
    },
  };

  return createProxyMiddleware(options);
}
