import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { env } from '../config/env';

const serviceUrls: Record<string, string> = {
  USER_MANAGEMENT: env.USER_MANAGEMENT_URL,
  TICKETING: env.TICKETING_SERVICE_URL,
};

export function createProxy(serviceName: string) {
  const target = serviceUrls[serviceName];
  if (!target) throw new Error(`Unknown service: ${serviceName}`);

  const options: Options = {
    target,
    changeOrigin: true,
    on: {
      error: (err, req, res: any) => {
        console.error(`[PROXY ERROR] ${serviceName}:`, err.message);
        res.status(502).json({ error: { code: 'SERVICE_UNAVAILABLE', message: `${serviceName} is unavailable` } });
      },
    },
  };

  return createProxyMiddleware(options);
}
