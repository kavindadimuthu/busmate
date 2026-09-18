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
      // The gateway is the only public-facing CORS boundary (each internal service's own CORS
      // config is scoped to localhost/internal ports only, by design - see user-service's
      // CorsConfig). http-proxy-middleware forwards every incoming header by default, including
      // Origin, which made an internal service re-apply its own narrow CORS check to a request
      // that already passed the gateway's - rejecting any real public frontend origin (this
      // would have broken the production Vercel origin too, not just a new one - discovered
      // while wiring in INC-013's PayHere checkout domain). The request past this point is a
      // trusted server-to-server hop, not a browser-originated cross-origin one, so Origin has
      // nothing left to say.
      proxyReq: (proxyReq) => {
        proxyReq.removeHeader('origin');
      },
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
