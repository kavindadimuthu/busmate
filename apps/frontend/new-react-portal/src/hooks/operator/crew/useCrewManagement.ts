'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from '@/lib/router';
import { useDataTable } from '@busmate/ui';
import { listUsers, AdminApiError } from '@/lib/api/adminUsers';
import type { AccountStatus } from '@/lib/api/adminUsers';
import { toAdminUser } from '@/data/admin/users';
import type { AdminUser } from '@/data/admin/users';
import { useMyOperator } from '@/hooks/operator/useMyOperator';

export type CrewFilters = { status: AccountStatus | '__all__' };

const INITIAL_FILTERS: CrewFilters = { status: '__all__' };

/**
 * Conductor accounts belonging to the logged-in operator.
 *
 * user-service has no operatorId-scoped conductor list endpoint (permission scope on
 * user.conductor:read is 'any', platform-wide) — this fetches every conductor account and
 * filters client-side to those whose profileData.assign_operator_id matches this operator's
 * own core-service Operator.id. Fine at this scale (a handful of conductors per operator);
 * would need a real server-side scoped endpoint if the platform grows much larger. See
 * docs/plans/Unified-Operator-Lifecycle-Management-Plan.md for the assign_operator_id field.
 */
export function useCrewManagement() {
  const router = useRouter();
  const { operator, isLoading: operatorLoading, error: operatorError } = useMyOperator();

  const { state, setPage, setPageSize, setSort, setSearch, setFilters, clearFilters } =
    useDataTable<CrewFilters>({
      initialPageSize: 10,
      initialSort: { column: 'fullName', direction: 'asc' },
      initialFilters: INITIAL_FILTERS,
    });

  const [allCrew, setAllCrew] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCrew = useCallback(async () => {
    if (!operator?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const page = await listUsers({ userType: 'conductor', size: 200 });
      const mine = (page.content ?? [])
        .map(toAdminUser)
        .filter((c) => c.profileData?.assign_operator_id === operator.id);
      setAllCrew(mine);
    } catch (err) {
      console.error('Error loading crew:', err);
      setError(err instanceof AdminApiError ? err.message : 'Failed to load crew.');
    } finally {
      setIsLoading(false);
    }
  }, [operator?.id]);

  useEffect(() => {
    loadCrew();
  }, [loadCrew]);

  const filtered = useMemo(() => {
    let result = allCrew;

    if (state.filters.status !== '__all__') {
      result = result.filter((c) => c.status === state.filters.status);
    }

    if (state.searchQuery.trim()) {
      const term = state.searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.fullName.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term) ||
          c.username.toLowerCase().includes(term),
      );
    }

    const dir = state.sortDirection === 'desc' ? -1 : 1;
    if (state.sortColumn) {
      result = [...result].sort((a, b) => {
        const aVal = String((a as unknown as Record<string, unknown>)[state.sortColumn!] ?? '');
        const bVal = String((b as unknown as Record<string, unknown>)[state.sortColumn!] ?? '');
        return aVal.localeCompare(bVal) * dir;
      });
    }

    return result;
  }, [allCrew, state.filters.status, state.searchQuery, state.sortColumn, state.sortDirection]);

  const stats = useMemo(
    () => ({
      total: allCrew.length,
      active: allCrew.filter((c) => c.status === 'active').length,
      inactive: allCrew.filter((c) => c.status === 'inactive').length,
      pending: allCrew.filter((c) => c.status === 'pending').length,
    }),
    [allCrew],
  );

  const totalItems = filtered.length;
  const paginatedCrew = useMemo(() => {
    const start = (state.page - 1) * state.pageSize;
    return filtered.slice(start, start + state.pageSize);
  }, [filtered, state.page, state.pageSize]);

  const handleView = useCallback((c: AdminUser) => router.push(`/operator/crew/${c.id}`), [router]);
  const handleAdd = useCallback(() => router.push('/operator/crew/create'), [router]);

  const activeFilterCount = state.filters.status !== '__all__' ? 1 : 0;

  return {
    state,
    crew: paginatedCrew,
    totalItems,
    stats,
    isLoading: isLoading || operatorLoading,
    error: error ?? operatorError,
    activeFilterCount,
    setPage,
    setPageSize,
    setSort,
    setSearch,
    setFilters,
    clearFilters,
    handleView,
    handleAdd,
    handleRefresh: loadCrew,
    operator,
  };
}
