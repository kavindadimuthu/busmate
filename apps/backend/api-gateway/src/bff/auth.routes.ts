import { Router } from 'express';
import { clearSessionCookies, getAccessTokenCookie, getRefreshTokenCookie, setSessionCookies } from './cookies';
import {
  fetchCurrentUser,
  isAccessTokenValid,
  loginWithPassword,
  logoutUpstream,
  refreshSession,
  UpstreamAuthError,
} from './session';
import { getRoleRedirectPath, isPortalRole } from './roles';

export const bffAuthRouter = Router();

bffAuthRouter.post('/login', async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  try {
    const session = await loginWithPassword(email, password);

    // This BFF serves the staff portal only — passenger/conductor accounts
    // use the mobile apps' own Bearer-token flow via /api/auth/*.
    if (!isPortalRole(session.userType)) {
      await logoutUpstream(session.accessToken);
      res.status(403).json({
        error: 'This portal is for staff accounts only. Please use the passenger or conductor app instead.',
      });
      return;
    }

    setSessionCookies(res, session);
    res.json({ userType: session.userType, redirectPath: getRoleRedirectPath(session.userType) });
  } catch (error) {
    if (error instanceof UpstreamAuthError) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    console.error('[BFF] Login failed:', error);
    res.status(502).json({ error: 'Unable to reach the authentication service' });
  }
});

bffAuthRouter.post('/logout', async (req, res) => {
  const accessToken = getAccessTokenCookie(req);
  if (accessToken) {
    await logoutUpstream(accessToken);
  }
  clearSessionCookies(res);
  res.json({ status: 'success', message: 'Logged out successfully' });
});

bffAuthRouter.get('/me', async (req, res) => {
  let accessToken = getAccessTokenCookie(req);

  if (!accessToken || !(await isAccessTokenValid(accessToken))) {
    const refreshToken = getRefreshTokenCookie(req);
    if (!refreshToken) {
      clearSessionCookies(res);
      res.status(401).json({ error: 'No session' });
      return;
    }

    try {
      const session = await refreshSession(refreshToken);
      setSessionCookies(res, session);
      accessToken = session.accessToken;
    } catch {
      clearSessionCookies(res);
      res.status(401).json({ error: 'Session expired' });
      return;
    }
  }

  try {
    const user = await fetchCurrentUser(accessToken);
    res.json(user);
  } catch (error) {
    if (error instanceof UpstreamAuthError) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    res.status(502).json({ error: 'Unable to reach the authentication service' });
  }
});

// Hands the SPA a short-lived, readable access token pulled from the httpOnly
// cookie (the refresh token itself never leaves httpOnly storage) so the
// generated OpenAPI clients can fill in their Authorization header client-side.
bffAuthRouter.get('/token', async (req, res) => {
  const accessToken = getAccessTokenCookie(req);

  if (accessToken && (await isAccessTokenValid(accessToken))) {
    res.json({ accessToken });
    return;
  }

  const refreshToken = getRefreshTokenCookie(req);
  if (!refreshToken) {
    res.status(401).json({ error: 'No session' });
    return;
  }

  try {
    const session = await refreshSession(refreshToken);
    setSessionCookies(res, session);
    res.json({ accessToken: session.accessToken });
  } catch {
    clearSessionCookies(res);
    res.status(401).json({ error: 'Failed to get token' });
  }
});
