import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { corsMiddleware } from './middleware/cors.middleware';
import { rateLimiter, authRateLimiter } from './middleware/rateLimiter.middleware';
import { authMiddleware } from './middleware/auth.middleware';
import { requestLogger } from './middleware/requestLogger.middleware';
import { metricsMiddleware, metricsHandler } from './middleware/metrics.middleware';
import { errorHandler } from './middleware/errorHandler.middleware';
import { createProxy } from './proxy/serviceProxy';
import { routes } from './config/routes.config';
import { bffAuthRouter } from './bff/auth.routes';
import { aiRouter } from './routes/ai.routes';
import { liveRouter } from './live/live.routes';
import { requireStaffRole } from './middleware/requireStaffRole.middleware';

export function createApp() {
  const app = express();

  // Global middleware
  app.use(helmet());
  app.use(corsMiddleware);
  app.use(cookieParser());
  app.use(requestLogger);
  app.use(metricsMiddleware);

  // Prometheus scrape endpoint — registered before the rate limiter so monitoring is
  // never throttled, and before auth so scrapers don't need a token.
  app.get('/metrics', metricsHandler);

  app.use(rateLimiter);

  // Block all /internal/** routes — never expose to clients
  app.use('/internal', (req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' } });
  });

  // Health check (no auth)
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Stricter rate limiting on auth paths
  app.use(
    ['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password', '/api/bff/auth/login'],
    authRateLimiter,
  );

  // BFF: httpOnly-cookie session for new-react-portal (staff portal SPA).
  // Mounted ahead of the proxy loop with its own scoped json() parser —
  // a global express.json() would consume the body stream the proxy needs
  // to forward raw. Strictly additive: doesn't touch the existing
  // Bearer-token /api/auth/* flow used by passenger-web/conductor-mobile.
  app.use('/api/bff/auth', express.json(), bffAuthRouter);

  // AI route-generation proxy (Gemini) — keeps GEMINI_API_KEY server-side.
  // Requires a valid portal session; same scoped-json-parser reasoning as
  // the BFF above.
  app.use('/api/ai', authMiddleware, express.json(), aiRouter);

  // Live-tracking SSE stream (IoT Platform Layer plan, Phase 3) — staff-only (MOT/admin), fed by
  // the Kafka consumer started in index.ts. Mounted directly (not via routes.config's proxy loop)
  // since this is a gateway-owned endpoint, not a proxy to a backend service.
  app.use('/live', authMiddleware, requireStaffRole(['admin', 'mot']), liveRouter);

  // Route registration. Proxies are mounted at the app root (not at
  // route.pathPrefix) and rely on pathFilter internally — see serviceProxy.ts
  // for why sub-path mounting breaks exact-match routes.
  for (const route of routes) {
    const proxy = createProxy(route.target, route.pathPrefix);
    if (route.requiresAuth) {
      app.use(route.pathPrefix, authMiddleware);
    }
    app.use(proxy);
  }

  app.use(errorHandler);
  return app;
}
