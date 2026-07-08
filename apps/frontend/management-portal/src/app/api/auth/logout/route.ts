import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_TOKEN_COOKIE, clearSessionCookies, logoutSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    if (accessToken) {
      await logoutSession(accessToken);
    }

    const response = NextResponse.json({ status: 'success', message: 'Logged out successfully' });
    clearSessionCookies(response);
    return response;
  } catch (error) {
    console.error("Error during logout:", error);
    const response = NextResponse.json({ status: 'error', message: 'Logout failed' }, { status: 500 });
    clearSessionCookies(response);
    return response;
  }
}
