'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  getOperatorTrips,
  getOperatorTripStats,
  getOperatorTripFilterOptions,
  type OperatorTrip,
  type OperatorTripStatistics,
  type OperatorTripFilterOptions,
  type TripStatus,
  type GetTripsParams,
} from '@/data/operator/trips';

// ── Types ─────────────────────────────────────────────────────────

interface QueryParams {
  page: number;
  size: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  search: string;
  status?: TripStatus;
  routeId?: string;
  scheduleId?: string;
  busId?: string;
  permitId?: string;
  fromDate?: string;
  toDate?: string;
}

const INITIAL_QUERY: QueryParams = {
  page: 0,
  size: 10,
  sortBy: 'tripDate',
  sortDir: 'desc',
  search: '',
};

// ── Hook ──────────────────────────────────────────────────────────

export function useOperatorTripsListing() {
  const router = useRouter();

  const [trips, setTrips] = useState<OperatorTrip[]>([]);
  const [stats, setStats] = useState<OperatorTripStatistics | null>(null);
  const [filterOptions, setFilterOptions] = useState<OperatorTripFilterOptions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: 10,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('__all__');
  const [routeFilter, setRouteFilter] = useState('__all__');
  const [scheduleFilter, setScheduleFilter] = useState('__all__');
  const [busFilter, setBusFilter] = useState('__all__');
  const [permitFilter, setPermitFilter] = useState('__all__');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [queryParams, setQueryParams] = useState<QueryParams>(INITIAL_QUERY);

  // ── Data loading ────────────────────────────────────────────────

  const loadStatistics = useCallback(() => {
    setStatsLoading(true);
    try {
      setStats(getOperatorTripStats());
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadFilterOptions = useCallback(() => {
    setFilterOptions(getOperatorTripFilterOptions());
  }, []);

  useEffect(() => {
    loadStatistics();
    loadFilterOptions();
  }, [loadStatistics, loadFilterOptions]);

  const loadTrips = useCallback(() => {
    setIsLoading(true);
    setError(null);
    try {
      const result = getOperatorTrips(queryParams as GetTripsParams);
      setTrips(result.data);
      setPagination({
        currentPage: queryParams.page,
        totalPages: result.totalPages,
        totalElements: result.totalElements,
        pageSize: queryParams.size,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load trips');
    } finally {
      setIsLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  // ── Filter sync ─────────────────────────────────────────────────

  const updateQueryParams = useCallback(
    (updates: Partial<QueryParams>) => {
      setQueryParams((prev) => ({
        ...prev,
        ...updates,
        status: statusFilter !== '__all__' ? (statusFilter as TripStatus) : undefined,
        routeId: routeFilter !== '__all__' ? routeFilter : undefined,
        scheduleId: scheduleFilter !== '__all__' ? scheduleFilter : undefined,
        busId: busFilter !== '__all__' ? busFilter : undefined,
        permitId: permitFilter !== '__all__' ? permitFilter : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      }));
    },
    [statusFilter, routeFilter, scheduleFilter, busFilter, permitFilter, fromDate, toDate],
  );

  useEffect(() => {
    const timer = setTimeout(() => updateQueryParams({ page: 0 }), 300);
    return () => clearTimeout(timer);
  }, [statusFilter, routeFilter, scheduleFilter, busFilter, permitFilter, fromDate, toDate, updateQueryParams]);

  // ── Handlers ────────────────────────────────────────────────────

  const handleSearch = useCallback(
    (term: string) => {
      setSearchTerm(term);
      updateQueryParams({ search: term, page: 0 });
    },
    [updateQueryParams],
  );

  const handleSort = useCallback(
    (sortBy: string, sortDir: 'asc' | 'desc') => {
      updateQueryParams({ sortBy, sortDir, page: 0 });
    },
    [updateQueryParams],
  );

  const handlePageChange = useCallback(
    (page: number) => updateQueryParams({ page }),
    [updateQueryParams],
  );

  const handlePageSizeChange = useCallback(
    (size: number) => updateQueryParams({ size, page: 0 }),
    [updateQueryParams],
  );

  const handleView = useCallback(
    (tripId: string) => router.push(`/operator/trips/${tripId}`),
    [router],
  );

  const handleClearAllFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('__all__');
    setRouteFilter('__all__');
    setScheduleFilter('__all__');
    setBusFilter('__all__');
    setPermitFilter('__all__');
    setFromDate('');
    setToDate('');
    setQueryParams((prev) => ({ ...INITIAL_QUERY, size: prev.size }));
  }, []);

  const handleRefresh = useCallback(() => {
    loadTrips();
    loadStatistics();
  }, [loadTrips, loadStatistics]);

  const emptyFilterOptions = useMemo<OperatorTripFilterOptions>(
    () => ({ statuses: [], routes: [], schedules: [], permits: [], buses: [] }),
    [],
  );

  return {
    trips,
    stats,
    filterOptions: filterOptions ?? emptyFilterOptions,
    isLoading,
    statsLoading,
    error,
    pagination,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    routeFilter,
    setRouteFilter,
    scheduleFilter,
    setScheduleFilter,
    busFilter,
    setBusFilter,
    permitFilter,
    setPermitFilter,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    queryParams,
    handleSearch,
    handleSort,
    handlePageChange,
    handlePageSizeChange,
    handleView,
    handleClearAllFilters,
    handleRefresh,
  };
}
