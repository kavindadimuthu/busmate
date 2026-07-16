'use server';

import { cookies } from 'next/headers';
import { AccessTokenPayload } from '@/types/AccessTokenPayload';
import { ACCESS_TOKEN_COOKIE } from '@/lib/auth/session';
import { verifyAccessToken } from '@/lib/auth/tokenVerifier';

export async function getDecodedAccessToken(): Promise<AccessTokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
    if (!token) {
      return null;
    }

    return await verifyAccessToken(token);
  } catch (error) {
    console.error("Error verifying access token:", error);
    return null;
  }
}
