import { useState, useCallback, useEffect } from 'react';
import { useRouter } from '@/lib/router';
import { useDataTable } from '@busmate/ui';
import { BusOperatorOperationsService } from '@busmate/api-client-route';
import type { BusResponse } from '@busmate/api-client-route';
import { useMyOperator } from '@/hooks/operator/useMyOperator';

export type BusStatus = 'pending' | 'active' | 'inactive' | 'cancelled';
export type FleetFilters = { status: BusStatus | '__all__' };

export interface FleetStatistics {
  totalBuses: number;
  activeBuses: number;
  inactiveBuses: number;
  pendingBuses: number;
  totalCapacity: number;
  averageCapacity: number;
}

const INITIAL_FILTERS: FleetFilters = { status: '__all__' };
const EMPTY_STATS: FleetStatistics = {
  totalBuses: 0, activeBuses: 0, inactiveBuses: 0, pendingBuses: 0, totalCapacity: 0, averageCapacity: 0,
};

export function useFleetManagement() {
  const router = useRouter();
  const { operator, isLoading: operatorLoading, error: operatorError } = useMyOperator();

  const { state, setPage, setPageSize, setSort, setSearch, setFilters, clearFilters } =
    useDataTable<FleetFilters>({
      initialPageSize: 10,
      initialSort: { column: 'plateNumber', direction: 'asc' },
      initialFilters: INITIAL_FILTERS,
    });

  const [buses, setBuses] = useState<BusResponse[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState<FleetStatistics>(EMPTY_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // core-service has no operator-scoped fleet-statistics endpoint (its
  // /dashboard/summary is an unimplemented stub) — computed client-side from the full
  // (unfiltered, unpaginated) bus list instead. Fine at this scale: an operator's own
  // fleet is a handful of buses, not thousands.
  const loadStatistics = useCallback(async () => {
    if (!operator?.id) return;
    setStatsLoading(true);
    try {
      const result = await BusOperatorOperationsService.getOperatorBuses(operator.id, 0, 100);
      const all = result.content ?? [];
      const totalCapacity = all.reduce((sum, b) => sum + (b.capacity ?? 0), 0);
      setStats({
        totalBuses: all.length,
        activeBuses: all.filter((b) => b.status === 'active').length,
        inactiveBuses: all.filter((b) => b.status === 'inactive').length,
        pendingBuses: all.filter((b) => b.status === 'pending').length,
        totalCapacity,
        averageCapacity: all.length ? Math.round(totalCapacity / all.length) : 0,
      });
    } catch (err) {
      console.error('Error loading fleet statistics:', err);
      // Statistics are non-critical; fail silently.
    } finally {
      setStatsLoading(false);
    }
  }, [operator?.id]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const loadBuses = useCallback(async () => {
    if (!operator?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const status = state.filters.status === '__all__' ? undefined : state.filters.status;
      const result = await BusOperatorOperationsService.getOperatorBuses(
        operator.id,
        state.page - 1,
        state.pageSize,
        'ntcRegistrationNumber',
        'asc',
        status,
        state.searchQuery || undefined,
      );
      setBuses(result.content ?? []);
      setTotalItems(result.totalElements ?? 0);
    } catch (err) {
      console.error('Error loading fleet:', err);
      setError('Failed to load fleet data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [operator?.id, state.page, state.pageSize, state.searchQuery, state.filters.status]);

  useEffect(() => {
    loadBuses();
  }, [loadBuses]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([loadStatistics(), loadBuses()]);
  }, [loadStatistics, loadBuses]);

  const handleView = useCallback((bus: BusResponse) => {
    router.push(`/operator/fleet/${bus.id}`);
  }, [router]);

  const activeFilterCount = state.filters.status !== '__all__' ? 1 : 0;

  return {
    state,
    buses,
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
    loadBuses,
  };
}
