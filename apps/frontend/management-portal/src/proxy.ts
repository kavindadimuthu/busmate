import { NextRequest, NextResponse } from 'next/server';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearSessionCookies,
  refreshSession,
  setSessionCookies,
} from '@/lib/auth/session';
import { verifyAccessToken } from '@/lib/auth/tokenVerifier';

const PROTECTED_PREFIXES = ['/mot', '/operator', '/timekeeper', '/admin'];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Our own /api/auth/* routes (and any other API route) manage the session
  // cookies themselves — don't touch them here.
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  const response = NextResponse.next();
  let hasValidSession = false;

  if (accessToken) {
    try {
      await verifyAccessToken(accessToken);
      hasValidSession = true;
    } catch {
      hasValidSession = false;
    }
  }

  // Access token missing/expired but a refresh token is present — refresh
  // transparently so an active user is never bounced mid-session.
  if (!hasValidSession && refreshToken) {
    try {
      const session = await refreshSession(refreshToken);
      setSessionCookies(response, session);
      hasValidSession = true;
    } catch {
      hasValidSession = false;
      clearSessionCookies(response);
    }
  }

  if (isProtectedPath(pathname) && !hasValidSession) {
    const redirectResponse = NextResponse.redirect(new URL('/', req.url));
    clearSessionCookies(redirectResponse);
    return redirectResponse;
  }

  return response;
}

// Apply middleware to ALL routes except internals
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
