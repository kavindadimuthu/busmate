'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from '@/lib/router';
import { useDataTable } from '@busmate/ui';
import { BusOperatorOperationsService } from '@busmate/api-client-core';
import type { TripResponse } from '@busmate/api-client-core';
import { useMyOperator } from '@/hooks/operator/useMyOperator';

// Matches core-service's real TripStatusEnum exactly.
export type TripStatus =
  | 'pending'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'delayed'
  | 'in_transit'
  | 'boarding'
  | 'departed';

export type TripFilters = { status: TripStatus | '__all__' };

export interface TripStatistics {
  totalTrips: number;
  pendingTrips: number;
  activeTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  delayedTrips: number;
  inTransitTrips: number;
}

const INITIAL_FILTERS: TripFilters = { status: '__all__' };
const EMPTY_STATS: TripStatistics = {
  totalTrips: 0, pendingTrips: 0, activeTrips: 0, completedTrips: 0,
  cancelledTrips: 0, delayedTrips: 0, inTransitTrips: 0,
};

export function useTripsManagement() {
  const router = useRouter();
  const { operator, isLoading: operatorLoading, error: operatorError } = useMyOperator();

  const { state, setPage, setPageSize, setSort, setSearch, setFilters, clearFilters } =
    useDataTable<TripFilters>({
      initialPageSize: 10,
      initialSort: { column: 'tripDate', direction: 'desc' },
      initialFilters: INITIAL_FILTERS,
    });

  const [trips, setTrips] = useState<TripResponse[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState<TripStatistics>(EMPTY_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // No operator-scoped trip-statistics endpoint exists (core-service's TripService.getStatistics()
  // is global, not per-operator) - computed client-side from the full trip list instead, same
  // approach used for Fleet stats. Fine at this scale.
  const loadStatistics = useCallback(async () => {
    if (!operator?.id) return;
    setStatsLoading(true);
    try {
      const result = await BusOperatorOperationsService.getOperatorTrips(operator.id, 0, 200);
      const all = result.content ?? [];
      setStats({
        totalTrips: all.length,
        pendingTrips: all.filter((t) => t.status === 'pending').length,
        activeTrips: all.filter((t) => t.status === 'active').length,
        completedTrips: all.filter((t) => t.status === 'completed').length,
        cancelledTrips: all.filter((t) => t.status === 'cancelled').length,
        delayedTrips: all.filter((t) => t.status === 'delayed').length,
        inTransitTrips: all.filter((t) => t.status === 'in_transit' || t.status === 'boarding' || t.status === 'departed').length,
      });
    } catch (err) {
      console.error('Error loading trip statistics:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [operator?.id]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const loadTrips = useCallback(async () => {
    if (!operator?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const status = state.filters.status === '__all__' ? undefined : state.filters.status;
      const result = await BusOperatorOperationsService.getOperatorTrips(
        operator.id,
        state.page - 1,
        state.pageSize,
        state.sortColumn ?? 'tripDate',
        state.sortDirection ?? 'desc',
        status,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        state.searchQuery || undefined,
      );
      setTrips(result.content ?? []);
      setTotalItems(result.totalElements ?? 0);
    } catch (err) {
      console.error('Error loading trips:', err);
      setError('Failed to load trips. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [operator?.id, state.page, state.pageSize, state.sortColumn, state.sortDirection, state.searchQuery, state.filters.status]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([loadStatistics(), loadTrips()]);
  }, [loadStatistics, loadTrips]);

  const handleView = useCallback((trip: TripResponse) => {
    router.push(`/operator/trips/${trip.id}`);
  }, [router]);

  const activeFilterCount = state.filters.status !== '__all__' ? 1 : 0;

  return {
    state,
    trips,
    totalItems,
    stats,
    isLoading: isLoading || operatorLoading,
    statsLoading,
    error: error ?? operatorError,
    activeFilterCount,
    setPage,
    setPageSize,
    setSort,
    setSearch,
    setFilters,
    clearFilters,
    handleRefresh,
    handleView,
    loadTrips,
  };
}
