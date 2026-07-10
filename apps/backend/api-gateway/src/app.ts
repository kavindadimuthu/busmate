import express from 'express';
import helmet from 'helmet';
import { corsMiddleware } from './middleware/cors.middleware';
import { rateLimiter, authRateLimiter } from './middleware/rateLimiter.middleware';
import { authMiddleware } from './middleware/auth.middleware';
import { requestLogger } from './middleware/requestLogger.middleware';
import { errorHandler } from './middleware/errorHandler.middleware';
import { createProxy } from './proxy/serviceProxy';
import { routes } from './config/routes.config';
import { bffAuthRouter } from './bff/auth.routes';

export function createApp() {
  const app = express();

  // Global middleware
  app.use(helmet());
  app.use(corsMiddleware);
  app.use(requestLogger);
  app.use(rateLimiter);

  // Block all /internal/** routes — never expose to clients
  app.use('/internal', (req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' } });
  });

  // Health check (no auth)
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Stricter rate limiting on auth paths (both the Bearer-token flow and the
  // BFF cookie flow's login endpoint).
  app.use(
    ['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password', '/api/bff/auth/login'],
    authRateLimiter,
  );

  // BFF module for the government-portal / operator-portal SPAs. Additive and
  // isolated at '/api/bff/*' so it never affects the '/api/auth/*' Bearer-token
  // flow used by passenger-web/conductor-mobile. express.json() is scoped to
  // this router only — mounting it globally would break the proxy's request
  // body streaming for every other route.
  app.use('/api/bff/auth', express.json(), bffAuthRouter);

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
