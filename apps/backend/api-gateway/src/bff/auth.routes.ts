// BFF auth routes for the government-portal / operator-portal SPAs.
//
// This module is deliberately additive and self-contained: it is mounted at
// the distinct '/api/bff/auth' prefix so it never touches the existing
// '/api/auth/*' Bearer-token flow used by passenger-web and conductor-mobile.
// It keeps management-portal's original httpOnly-cookie security posture for
// higher-privilege staff accounts, and imports nothing from the proxy layer,
// so it can be lifted into its own service later with just a folder move.
import { Router, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import {
  GatewayAuthError,
  fetchMe,
  getJwtSecret,
  loginWithPassword,
  logoutSession,
  refreshSession,
} from './session';
import { getRoleRedirectPath, isPortalRole } from './roles';
import {
  clearSessionCookies,
  getAccessTokenCookie,
  getRefreshTokenCookie,
  setSessionCookies,
} from './cookies';

export const bffAuthRouter = Router();

// POST /api/bff/auth/login — exchange credentials for httpOnly session cookies.
bffAuthRouter.post('/login', async (req: Request, res: Response) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const session = await loginWithPassword(email, password);

    // Staff accounts only — passengers/conductors use the mobile apps.
    if (!isPortalRole(session.userType)) {
      await logoutSession(session.accessToken);
      return res.status(403).json({
        error: 'This portal is for staff accounts only. Please use the passenger or conductor app instead.',
      });
    }

    setSessionCookies(res, session);
    return res.json({
      userType: session.userType,
      redirectPath: getRoleRedirectPath(session.userType),
    });
  } catch (error) {
    if (error instanceof GatewayAuthError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('[BFF] Login failed:', error);
    return res.status(502).json({ error: 'Unable to reach the authentication service' });
  }
});

// POST /api/bff/auth/logout — best-effort upstream revoke, then clear cookies.
bffAuthRouter.post('/logout', async (req: Request, res: Response) => {
  try {
    const accessToken = getAccessTokenCookie(req);
    if (accessToken) {
      await logoutSession(accessToken);
    }
    clearSessionCookies(res);
    return res.json({ status: 'success', message: 'Logged out successfully' });
  } catch (error) {
    console.error('[BFF] Error during logout:', error);
    clearSessionCookies(res);
    return res.status(500).json({ status: 'error', message: 'Logout failed' });
  }
});

// GET /api/bff/auth/token — hands the SPA a short-lived, readable access token
// derived from the httpOnly cookie (refreshing it transparently if expired).
// The SPA holds this in memory and uses it as `Authorization: Bearer` for direct
// gateway API calls; the refresh token stays httpOnly. Mirrors management-portal's
// /api/auth/token route so the generated OpenAPI clients work unchanged.
bffAuthRouter.get('/token', async (req: Request, res: Response) => {
  const accessToken = getAccessTokenCookie(req);
  if (accessToken) {
    try {
      jwt.verify(accessToken, getJwtSecret(), { algorithms: ['HS256'] });
      return res.json({ accessToken });
    } catch {
      // Expired/invalid — fall through to refresh.
    }
  }

  const refreshToken = getRefreshTokenCookie(req);
  if (!refreshToken) {
    clearSessionCookies(res);
    return res.status(401).json({ error: 'No session' });
  }
  try {
    const session = await refreshSession(refreshToken);
    setSessionCookies(res, session);
    return res.json({ accessToken: session.accessToken });
  } catch {
    clearSessionCookies(res);
    return res.status(401).json({ error: 'Failed to get token' });
  }
});

// GET /api/bff/auth/me — the SPA bootstrap call. Validates the access cookie
// (refreshing transparently if expired) and returns the current user + role so
// the client AuthProvider can gate routes. Replaces management-portal's
// server-component getUserData() + /api/auth/token flow in one call.
bffAuthRouter.get('/me', async (req: Request, res: Response) => {
  let accessToken = getAccessTokenCookie(req);
  let tokenValid = false;

  if (accessToken) {
    try {
      jwt.verify(accessToken, getJwtSecret(), { algorithms: ['HS256'] });
      tokenValid = true;
    } catch {
      tokenValid = false;
    }
  }

  // Access token missing/expired — try a refresh using the refresh cookie.
  if (!tokenValid) {
    const refreshToken = getRefreshTokenCookie(req);
    if (!refreshToken) {
      clearSessionCookies(res);
      return res.status(401).json({ error: 'No session' });
    }
    try {
      const session = await refreshSession(refreshToken);
      setSessionCookies(res, session);
      accessToken = session.accessToken;
    } catch {
      clearSessionCookies(res);
      return res.status(401).json({ error: 'Session expired' });
    }
  }

  const me = await fetchMe(accessToken as string);
  if (!me) {
    clearSessionCookies(res);
    return res.status(401).json({ error: 'Unable to load profile' });
  }

  const userType = String(me.userType ?? '');
  if (!isPortalRole(userType)) {
    clearSessionCookies(res);
    return res.status(403).json({ error: 'This portal is for staff accounts only.' });
  }

  return res.json({
    userId: me.userId ?? null,
    email: me.email ?? '',
    fullName: me.fullName ?? me.username ?? '',
    username: me.username ?? me.email ?? '',
    userType,
    redirectPath: getRoleRedirectPath(userType),
  });
});
