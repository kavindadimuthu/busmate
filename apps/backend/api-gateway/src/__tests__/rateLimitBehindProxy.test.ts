import request from 'supertest';

// The limiters read env at import time, so each case builds a fresh app under its own environment.
function buildApp(trustProxyHops: string) {
  process.env.SUPABASE_JWT_SECRET = 'test-secret';
  process.env.USER_SERVICE_URL = 'http://localhost:1';
  process.env.CORE_SERVICE_URL = 'http://localhost:1';
  process.env.TICKETING_SERVICE_URL = 'http://localhost:1';
  process.env.RATE_LIMIT_MAX = '2';
  process.env.RATE_LIMIT_WINDOW_MS = '60000';
  process.env.TRUST_PROXY_HOPS = trustProxyHops;

  let app: import('express').Express;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    app = require('../app').createApp();
  });
  return app!;
}

describe('rate limiting behind the reverse proxy (INC-033)', () => {
  it('limits each client separately when the proxy hop is trusted', async () => {
    const app = buildApp('1');

    // Client A spends its allowance of two requests, and the third is refused.
    await request(app).get('/health').set('X-Forwarded-For', '203.0.113.10').expect(200);
    await request(app).get('/health').set('X-Forwarded-For', '203.0.113.10').expect(200);
    await request(app).get('/health').set('X-Forwarded-For', '203.0.113.10').expect(429);

    // Client B is a different person behind the same proxy, and is unaffected.
    await request(app).get('/health').set('X-Forwarded-For', '198.51.100.7').expect(200);
  });

  it('with no proxy trusted, ignores X-Forwarded-For so a client cannot pick its own IP', async () => {
    const app = buildApp('0');

    // Every request comes from the same socket, so rotating the header buys nothing.
    await request(app).get('/health').set('X-Forwarded-For', '203.0.113.1').expect(200);
    await request(app).get('/health').set('X-Forwarded-For', '203.0.113.2').expect(200);
    await request(app).get('/health').set('X-Forwarded-For', '203.0.113.3').expect(429);
  });
});
