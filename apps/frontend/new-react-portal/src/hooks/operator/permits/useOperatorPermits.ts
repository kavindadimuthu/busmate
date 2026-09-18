'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDataTable } from '@busmate/ui';
import { BusOperatorOperationsService } from '@busmate/api-client-core';
import type { PassengerServicePermitResponse } from '@busmate/api-client-core';
import { useMyOperator } from '@/hooks/operator/useMyOperator';
import { apiErrorMessage } from '@/lib/api/errors';
import { isExpiringSoon } from '@/lib/permits';

export type PermitListFilters = { status: string; permitType: string };

export interface PermitStatistics {
  total: number;
  active: number;
  suspended: number;
  withdrawn: number;
  expired: number;
  expiringSoon: number;
}

const INITIAL_FILTERS: PermitListFilters = { status: '__all__', permitType: '__all__' };
/** '__all__' (and a cleared filter) means no filter. */
function filterValue(value?: string): string | undefined {
  return value && value !== '__all__' ? value : undefined;
}

const SORTABLE = new Set(['permitNumber', 'issueDate', 'expiryDate', 'status', 'createdAt', 'updatedAt']);

/** The logged-in operator's own permits, filtered, sorted and paged by core-service (INC-017). */
export function useOperatorPermits() {
  const { operator, isLoading: operatorLoading, error: operatorError } = useMyOperator();
  const table = useDataTable<PermitListFilters>({
    initialPageSize: 10,
    initialSort: { column: 'expiryDate', direction: 'asc' },
    initialFilters: INITIAL_FILTERS,
  });
  const { state } = table;

  const [permits, setPermits] = useState<PassengerServicePermitResponse[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState<PermitStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!operator?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const sortBy = state.sortColumn && SORTABLE.has(state.sortColumn) ? state.sortColumn : 'expiryDate';
      const result = await BusOperatorOperationsService.getOperatorPermits(
        operator.id,
        state.page - 1,
        state.pageSize,
        sortBy,
        state.sortDirection ?? 'asc',
        filterValue(state.filters.status),
        filterValue(state.filters.permitType),
        state.searchQuery || undefined,
      );
      setPermits(result.content ?? []);
      setTotalItems(result.totalElements ?? 0);
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to load permits'));
    } finally {
      setIsLoading(false);
    }
  }, [operator?.id, state.page, state.pageSize, state.sortColumn, state.sortDirection, state.searchQuery, state.filters]);

  // Statistics over every permit the operator holds, independent of the table's filters.
  const loadStats = useCallback(async () => {
    if (!operator?.id) return;
    try {
      const all = await BusOperatorOperationsService.getOperatorPermits(operator.id, 0, 100, 'permitNumber', 'asc');
      const content = all.content ?? [];
      const live = content.filter((p) => p.status === 'active');
      setStats({
        total: content.length,
        active: live.filter((p) => !p.expired).length,
        suspended: content.filter((p) => p.status === 'inactive').length,
        withdrawn: content.filter((p) => p.status === 'cancelled').length,
        expired: live.filter((p) => p.expired).length,
        expiringSoon: live.filter((p) => !p.expired && isExpiringSoon(p.expiryDate)).length,
      });
    } catch {
      setStats(null);
    }
  }, [operator?.id]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const refresh = useCallback(async () => {
    await Promise.all([load(), loadStats()]);
  }, [load, loadStats]);

  return {
    ...table,
    operator,
    permits,
    totalItems,
    stats,
    isLoading: isLoading || operatorLoading,
    error: error ?? operatorError,
    setError,
    refresh,
  };
}
