'use server';

import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { AccessTokenPayload } from '@/types/AccessTokenPayload';
import { ACCESS_TOKEN_COOKIE, getJwtSecret } from '@/lib/auth/session';

export async function getDecodedAccessToken(): Promise<AccessTokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
    if (!token) {
      return null;
    }

    return jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as AccessTokenPayload;
  } catch (error) {
    console.error("Error verifying access token:", error);
    return null;
  }
}
