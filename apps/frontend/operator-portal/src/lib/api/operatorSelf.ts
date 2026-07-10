// Resolves the logged-in operator's own core-service Operator record (buses/permits
// attach to this id, not the user-service userId). Ported from management-portal.
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

export async function getMyOperator(userId: string): Promise<OperatorResponse> {
  let token: string | null = null;
  try {
    token = await fetchAccessToken();
  } catch {
    // Endpoint is public; a missing token isn't fatal.
  }

  const res = await fetch(`${RouteAPI.BASE}/api/operators/by-user/${userId}`, {
    credentials: 'include',
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
