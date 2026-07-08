import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearSessionCookies,
  getJwtSecret,
  refreshSession,
  setSessionCookies,
} from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  if (accessToken) {
    try {
      jwt.verify(accessToken, getJwtSecret(), { algorithms: ['HS256'] });
      return NextResponse.json({ accessToken });
    } catch {
      // Expired or invalid — fall through and try to refresh below.
    }
  }

  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: 'No session' }, { status: 401 });
  }

  try {
    const session = await refreshSession(refreshToken);
    const response = NextResponse.json({ accessToken: session.accessToken });
    setSessionCookies(response, session);
    return response;
  } catch {
    const response = NextResponse.json({ error: 'Failed to get token' }, { status: 401 });
    clearSessionCookies(response);
    return response;
  }
}
