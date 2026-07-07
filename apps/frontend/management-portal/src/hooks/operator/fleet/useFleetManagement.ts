import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDataTable } from '@busmate/ui';
import {
  getOperatorBuses,
  getFleetStatistics,
  type OperatorBus,
  type FleetStatistics,
  type BusStatus,
  type BusServiceType,
} from '@/data/operator/buses';

export type FleetFilters = { status: string; serviceType: string };

const INITIAL_FILTERS: FleetFilters = { status: '__all__', serviceType: '__all__' };

export function useFleetManagement() {
  const router = useRouter();

  const { state, setPage, setPageSize, setSort, setSearch, setFilters, clearFilters } =
    useDataTable<FleetFilters>({
      initialPageSize: 10,
      initialSort: { column: 'plateNumber', direction: 'asc' },
      initialFilters: INITIAL_FILTERS,
    });

  const [buses, setBuses] = useState<OperatorBus[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState<FleetStatistics>({
    totalBuses: 0, activeBuses: 0, inactiveBuses: 0,
    maintenanceBuses: 0, totalCapacity: 0, averageCapacity: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatistics = useCallback(async () => {
    setStatsLoading(true);
    try {
      const s = await getFleetStatistics();
      setStats(s);
    } catch {
      // Statistics are non-critical; fail silently.
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const loadBuses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getOperatorBuses({
        page: state.page - 1,
        size: state.pageSize,
        search: state.searchQuery,
        status: (state.filters.status === '__all__' ? 'ALL' : state.filters.status) as BusStatus | 'ALL',
        serviceType: (state.filters.serviceType === '__all__' ? 'ALL' : state.filters.serviceType) as BusServiceType | 'ALL',
      });
      setBuses(result.content);
      setTotalItems(result.totalElements);
    } catch (err) {
      console.error('Error loading fleet:', err);
      setError('Failed to load fleet data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [state.page, state.pageSize, state.searchQuery, state.filters.status, state.filters.serviceType]);

  useEffect(() => {
    loadBuses();
  }, [loadBuses]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([loadStatistics(), loadBuses()]);
  }, [loadStatistics, loadBuses]);

  const handleView = useCallback((bus: OperatorBus) => {
    router.push(`/operator/fleet/${bus.id}`);
  }, [router]);

  const activeFilterCount =
    (state.filters.status !== '__all__' ? 1 : 0) +
    (state.filters.serviceType !== '__all__' ? 1 : 0);

  return {
    state,
    buses,
    totalItems,
    stats,
    isLoading,
    statsLoading,
    error,
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
