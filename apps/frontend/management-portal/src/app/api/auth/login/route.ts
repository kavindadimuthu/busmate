import { NextRequest, NextResponse } from 'next/server';
import {
  GatewayAuthError,
  isPortalRole,
  loginWithPassword,
  logoutSession,
  setSessionCookies,
} from '@/lib/auth/session';
import { getRoleRedirectPath } from '@/lib/utils/getRoleRedirectPath';

export async function POST(request: NextRequest) {
  let email = '';
  let password = '';
  try {
    const body = await request.json();
    email = typeof body.email === 'string' ? body.email.trim() : '';
    password = typeof body.password === 'string' ? body.password : '';
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  try {
    const session = await loginWithPassword(email, password);

    // The portal is for staff accounts only — passengers/conductors are
    // served by the mobile apps and must not get a portal session here.
    if (!isPortalRole(session.userType)) {
      await logoutSession(session.accessToken);
      return NextResponse.json(
        { error: 'This portal is for staff accounts only. Please use the passenger or conductor app instead.' },
        { status: 403 },
      );
    }

    const response = NextResponse.json({
      userType: session.userType,
      redirectPath: getRoleRedirectPath(session.userType),
    });
    setSessionCookies(response, session);
    return response;
  } catch (error) {
    if (error instanceof GatewayAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Login failed:', error);
    return NextResponse.json({ error: 'Unable to reach the authentication service' }, { status: 502 });
  }
}
