// jest.mock is hoisted above the imports below by Jest's transform, so config/env never runs
// its real requireEnv() validation (which would throw without real env vars set) — everything
// that imports '../config/env', directly or transitively, sees this fake instead.
jest.mock('../config/env', () => ({
  env: {
    PORT: 8080,
    SUPABASE_JWT_SECRET: 'test-secret',
    USER_MANAGEMENT_URL: 'http://localhost:8081',
    TICKETING_SERVICE_URL: 'http://localhost:8083',
    NODE_ENV: 'test',
    ALLOWED_ORIGINS: ['http://localhost:3000'],
    RATE_LIMIT_WINDOW_MS: 60000,
    RATE_LIMIT_MAX: 100,
  },
}));

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { authMiddleware } from '../middleware/auth.middleware';
import { createApp } from '../app';

const SECRET = 'test-secret';

function buildReq(authHeader?: string): Request {
  return { headers: authHeader ? { authorization: authHeader } : {} } as unknown as Request;
}

function buildRes(): Response & { statusCode?: number; body?: any } {
  const res: any = {};
  res.status = jest.fn().mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn().mockImplementation((body: unknown) => {
    res.body = body;
    return res;
  });
  return res as Response & { statusCode?: number; body?: any };
}

function signToken(appMetadata: Record<string, unknown>, expiresIn: number | string = '1h'): string {
  return jwt.sign(
    { sub: 'user-123', email: 'someone@example.com', app_metadata: appMetadata },
    SECRET,
    { algorithm: 'HS256', expiresIn: expiresIn as any },
  );
}

describe('authMiddleware', () => {
  it('sets req.user correctly for a valid JWT', () => {
    const token = signToken({ user_type: 'passenger', account_status: 'active' });
    const req = buildReq(`Bearer ${token}`);
    const res = buildRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual({
      userId: 'user-123',
      email: 'someone@example.com',
      userType: 'passenger',
      accountStatus: 'active',
    });
    expect(req.headers['x-user-id']).toBe('user-123');
    expect(req.headers['x-user-type']).toBe('passenger');
  });

  it('returns 401 for an expired JWT', () => {
    const token = signToken({ user_type: 'passenger', account_status: 'active' }, -10);
    const req = buildReq(`Bearer ${token}`);
    const res = buildRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('returns 401 when the Authorization header is missing', () => {
    const req = buildReq();
    const res = buildRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.body.error.code).toBe('MISSING_TOKEN');
  });

  it('returns 403 for a suspended account', () => {
    const token = signToken({ user_type: 'passenger', account_status: 'suspended' });
    const req = buildReq(`Bearer ${token}`);
    const res = buildRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.body.error.code).toBe('ACCOUNT_SUSPENDED');
  });
});

describe('/internal/** blocking', () => {
  // This behavior actually lives in app.ts's route registration (a blanket block before the
  // proxy loop even runs), not in auth.middleware.ts itself — grouped into this file anyway
  // since the plan's test file listing puts this case here. Needs supertest + a full app
  // instance rather than calling the middleware function directly.
  it('returns 404 for /internal paths regardless of authentication', async () => {
    const app = createApp();

    const response = await request(app).get('/internal/users/00000000-0000-0000-0000-000000000000');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
