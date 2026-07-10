// Express cookie helpers for the BFF module. Mirrors the httpOnly-cookie
// contract from management-portal's session.ts (same cookie names, sliding
// refresh window, SameSite=lax). We parse request cookies with a tiny inline
// helper rather than pulling in cookie-parser as a new gateway dependency.
import type { Request, Response, CookieOptions } from 'express';
import { env } from '../config/env';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
  type GatewaySession,
} from './session';

function baseCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    // 'lax' lets the cookie ride top-level navigations (so a logged-in user
    // returning to the portal stays authenticated) while still blocking it on
    // cross-site POSTs — the main CSRF vector. State-changing BFF routes are
    // POST-only and same-origin, so lax is sufficient here.
    sameSite: 'lax',
    path: '/',
  };
}

export function setSessionCookies(
  res: Response,
  session: Pick<GatewaySession, 'accessToken' | 'refreshToken' | 'expiresIn'>,
): void {
  const opts = baseCookieOptions();
  res.cookie(ACCESS_TOKEN_COOKIE, session.accessToken, { ...opts, maxAge: session.expiresIn * 1000 });
  res.cookie(REFRESH_TOKEN_COOKIE, session.refreshToken, {
    ...opts,
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS * 1000,
  });
}

export function clearSessionCookies(res: Response): void {
  const opts = baseCookieOptions();
  res.clearCookie(ACCESS_TOKEN_COOKIE, opts);
  res.clearCookie(REFRESH_TOKEN_COOKIE, opts);
}

// Minimal RFC-6265 cookie-header parser — enough to read our two auth cookies
// without adding cookie-parser as a gateway-wide dependency.
function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const name = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (name) out[name] = decodeURIComponent(value);
  }
  return out;
}

export function getAccessTokenCookie(req: Request): string | undefined {
  return parseCookies(req.headers.cookie)[ACCESS_TOKEN_COOKIE];
}

export function getRefreshTokenCookie(req: Request): string | undefined {
  return parseCookies(req.headers.cookie)[REFRESH_TOKEN_COOKIE];
}
