import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify } from 'jose';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

// Auth migration Phase 2b: user-service now signs access tokens RS256, published at this JWKS
// endpoint. createRemoteJWKSet fetches and caches the key set itself (with its own cooldown on
// repeated misses), so this module never needs to poll or refresh anything by hand.
const remoteJwks = createRemoteJWKSet(new URL(`${env.USER_SERVICE_URL}/public/jwks.json`));

export interface SupabaseJwtPayload {
  sub: string;
  email: string;
  app_metadata?: {
    user_type?: string;
    account_status?: string;
  };
  exp: number;
}

/**
 * Verifies an access token regardless of which side of the Phase 2b cutover it was issued on.
 * RS256 tokens (current) verify against user-service's published JWKS; HS256 tokens (issued
 * before the cutover, still alive until they expire) verify against the legacy shared secret.
 * Once SUPABASE_JWT_SECRET's worth of access-token TTL has passed since the cutover deploy, no
 * HS256 tokens remain and that branch can be deleted.
 */
export async function verifyAccessToken(token: string): Promise<SupabaseJwtPayload> {
  const { alg } = decodeProtectedHeader(token);

  if (alg === 'RS256') {
    const { payload } = await jwtVerify(token, remoteJwks, { algorithms: ['RS256'] });
    return payload as unknown as SupabaseJwtPayload;
  }

  if (alg === 'HS256') {
    return jwt.verify(token, env.SUPABASE_JWT_SECRET, { algorithms: ['HS256'] }) as SupabaseJwtPayload;
  }

  throw new Error(`Unsupported access token algorithm: ${alg}`);
}
