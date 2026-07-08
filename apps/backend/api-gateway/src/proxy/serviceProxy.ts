import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { env } from '../config/env';

const serviceUrls: Record<string, string> = {
  USER_MANAGEMENT: env.USER_MANAGEMENT_URL,
  TICKETING: env.TICKETING_SERVICE_URL,
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
        console.error(`[PROXY ERROR] ${serviceName}:`, err.message);
        res.status(502).json({ error: { code: 'SERVICE_UNAVAILABLE', message: `${serviceName} is unavailable` } });
      },
    },
  };

  return createProxyMiddleware(options);
}
