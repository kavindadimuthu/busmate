import { NextResponse } from 'next/server';
import { asgardeo } from '@asgardeo/nextjs/server';

export async function GET() {
  try {
    const client = await asgardeo();
    const sessionId = await client.getSessionId();
    if (!sessionId) {
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    const accessToken = await client.getAccessToken(sessionId as string);
    return NextResponse.json({ accessToken });
  } catch {
    return NextResponse.json({ error: 'Failed to get token' }, { status: 401 });
  }
}
