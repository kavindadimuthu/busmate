import { Request, Response } from 'express';
import { env } from '../config/env';

export const ACCESS_TOKEN_COOKIE = 'bm_access_token';
export const REFRESH_TOKEN_COOKIE = 'bm_refresh_token';

// Sliding window: reset on every successful refresh, so an active user stays
// signed in indefinitely and an idle one is signed out after 7 days.
const REFRESH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

const baseCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export function setSessionCookies(res: Response, session: SessionTokens): void {
  res.cookie(ACCESS_TOKEN_COOKIE, session.accessToken, {
    ...baseCookieOptions,
    maxAge: session.expiresIn * 1000,
  });
  res.cookie(REFRESH_TOKEN_COOKIE, session.refreshToken, {
    ...baseCookieOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS * 1000,
  });
}

export function clearSessionCookies(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
  res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
}

export function getAccessTokenCookie(req: Request): string | undefined {
  return req.cookies?.[ACCESS_TOKEN_COOKIE];
}

export function getRefreshTokenCookie(req: Request): string | undefined {
  return req.cookies?.[REFRESH_TOKEN_COOKIE];
}
