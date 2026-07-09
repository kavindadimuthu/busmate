'use client';

// Resolves the logged-in operator's own core-service Operator record (the business
// entity — buses/permits attach to this id, not to the user-service userId) via the
// unified operator lifecycle link. See docs/plans/Unified-Operator-Lifecycle-Management-Plan.md.
import { OpenAPI as RouteAPI } from '@busmate/api-client-route';
import type { OperatorResponse } from '@busmate/api-client-route';
import { fetchAccessToken } from './setup';

export class OperatorSelfLookupError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'OperatorSelfLookupError';
    this.status = status;
  }
}

/**
 * GET /api/operators/by-user/{userId} — permitAll on the backend (same as every other
 * core-service GET), so this doesn't strictly need a token, but one is sent anyway for
 * consistency with every other call in this app.
 */
export async function getMyOperator(userId: string): Promise<OperatorResponse> {
  let token: string | null = null;
  try {
    token = await fetchAccessToken();
  } catch {
    // Fall through — the endpoint is public, so a missing/expired token isn't fatal here.
  }

  const res = await fetch(`${RouteAPI.BASE}/api/operators/by-user/${userId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new OperatorSelfLookupError(404, 'No operator record is linked to your account yet.');
    }
    throw new OperatorSelfLookupError(res.status, `Failed to load your operator profile (${res.status}).`);
  }

  return res.json();
}
