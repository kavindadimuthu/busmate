import 'server-only';

import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify } from 'jose';
import jwt from 'jsonwebtoken';
import { AccessTokenPayload } from '@/types/AccessTokenPayload';
import { getGatewayUrl, getJwtSecret } from './session';

// Auth migration Phase 2b: user-service now signs access tokens RS256, published at
// GET /public/jwks.json. This portal never talks to user-service directly (only the gateway
// URL is configured here), so it fetches the JWKS through the gateway's passthrough route —
// the same reason session.ts's login/refresh/logout calls all go through the gateway too.
// createRemoteJWKSet fetches and caches the key set itself, no manual refresh needed.
const remoteJwks = createRemoteJWKSet(new URL(`${getGatewayUrl()}/public/jwks.json`));

/**
 * Verifies an access token regardless of which side of the Phase 2b cutover it was issued on.
 * RS256 tokens (current) verify against user-service's published JWKS; HS256 tokens (issued
 * before the cutover, still alive until they expire) verify against the legacy shared secret.
 * Once the access-token TTL has elapsed since the cutover deploy, no HS256 tokens remain and
 * that branch (and getJwtSecret) can be deleted.
 */
export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { alg } = decodeProtectedHeader(token);

  if (alg === 'RS256') {
    const { payload } = await jwtVerify(token, remoteJwks, { algorithms: ['RS256'] });
    return payload as unknown as AccessTokenPayload;
  }

  if (alg === 'HS256') {
    return jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as AccessTokenPayload;
  }

  throw new Error(`Unsupported access token algorithm: ${alg}`);
}
