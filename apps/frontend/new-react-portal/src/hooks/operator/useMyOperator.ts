'use client';

import { useEffect, useState, useCallback } from 'react';
import type { OperatorResponse } from '@busmate/api-client-core';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';
import { getMyOperator, OperatorSelfLookupError } from '@/lib/api/operatorSelf';

/**
 * Resolves the logged-in operator's own core-service Operator record. Shared by Fleet and
 * Crew management — both are scoped to "this operator's" buses/conductors, which requires
 * the core-service Operator.id (not the user-service userId every other operator-dashboard
 * hook already has via useCurrentUserId()).
 */
export function useMyOperator() {
  const userId = useCurrentUserId();
  const [operator, setOperator] = useState<OperatorResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getMyOperator(userId);
      setOperator(result);
    } catch (err) {
      console.error('Error resolving own operator record:', err);
      setError(err instanceof OperatorSelfLookupError ? err.message : 'Failed to load your operator profile.');
      setOperator(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return { operator, isLoading, error, reload: load };
}
