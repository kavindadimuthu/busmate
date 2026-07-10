import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { env } from '../config/env';

const serviceUrls: Record<string, string> = {
  USER_SERVICE: env.USER_SERVICE_URL,
  CORE_SERVICE: env.CORE_SERVICE_URL,
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
      // The gateway is the single public entry point and owns public-facing CORS
      // (see cors.middleware.ts). Strip the browser Origin/Referer before
      // forwarding so internal services don't re-evaluate CORS against their own
      // hardcoded allowlists and 403 requests from new frontend origins (e.g. the
      // operator/government portals on :4100/:4200). Server-to-server proxied
      // calls should look same-origin to the upstream.
      proxyReq: (proxyReq) => {
        proxyReq.removeHeader('origin');
        proxyReq.removeHeader('referer');
      },
      error: (err, req, res: any) => {
        console.error(`[PROXY ERROR] ${serviceName}:`, err.message);
        res.status(502).json({ error: { code: 'SERVICE_UNAVAILABLE', message: `${serviceName} is unavailable` } });
      },
    },
  };

  return createProxyMiddleware(options);
}
