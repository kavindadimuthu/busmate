'use client';

// Resolves the logged-in operator's own core-service Operator record (the business
// entity — buses/permits attach to this id, not to the user-service userId) via the
// unified operator lifecycle link. See docs/plans/Unified-Operator-Lifecycle-Management-Plan.md.
import { ApiError, OperatorManagementService } from '@busmate/api-client-core';
import type { OperatorResponse } from '@busmate/api-client-core';

export class OperatorSelfLookupError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'OperatorSelfLookupError';
    this.status = status;
  }
}

/**
 * GET /api/operators/by-user/{userId} via the shared core-service client
 * (OperatorManagementService.getOperatorByUserId). Auth is applied centrally by the
 * client's TOKEN resolver wired in ./setup.ts; the endpoint is a public GET on the
 * backend, so it resolves the same fields getOperatorById does.
 */
export async function getMyOperator(userId: string): Promise<OperatorResponse> {
  try {
    return await OperatorManagementService.getOperatorByUserId(userId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw new OperatorSelfLookupError(404, 'No operator record is linked to your account yet.');
    }
    const status = error instanceof ApiError ? error.status : 0;
    throw new OperatorSelfLookupError(status, `Failed to load your operator profile (${status}).`);
  }
}
