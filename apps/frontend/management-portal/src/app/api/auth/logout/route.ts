import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {

  const clearSessionCookies = async () => {
    const cookieName = '__asgardeo__session';
    const cookieStore = await cookies();
    cookieStore.delete(cookieName);
  }
  
  try {
    // Clear the session cookie
    await clearSessionCookies();
    return NextResponse.json({ status: 'success', message: 'Logged out successfully' }, { status: 200 });
  } catch (error) {
    console.error("Error during logout:", error);
    return NextResponse.json({ status: 'error', message: 'Logout failed' }, { status: 500 });
  }
}