'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { DataPagination } from '@/components/shared/DataPagination';
import {
  OperatorTripStatsCards,
  OperatorTripsFilters,
  OperatorTripsTable,
} from '@/components/operator/trips';
import {
  getOperatorTrips,
  getOperatorTripStats,
  getOperatorTripFilterOptions,
} from '@/data/operator/trips';
import type {
  OperatorTrip,
  OperatorTripStatistics,
  OperatorTripFilterOptions,
  TripStatus,
  GetTripsParams,
} from '@/data/operator/trips';

// ── Query params ──────────────────────────────────────────────────

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

// ── Page ──────────────────────────────────────────────────────────

export default function OperatorTripsPage() {
  const router = useRouter();

  useSetPageMetadata({
    title: 'My Trips',
    description: 'View and monitor all trips operated by your fleet',
    activeItem: 'trips',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Trips' }],
  });

  // ── Data state ─────────────────────────────────────────────────
  const [trips, setTrips] = useState<OperatorTrip[]>([]);
  const [stats, setStats] = useState<OperatorTripStatistics | null>(null);
  const [filterOptions, setFilterOptions] = useState<OperatorTripFilterOptions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Pagination state ───────────────────────────────────────────
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: 10,
  });

  // ── Filter state ───────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [routeFilter, setRouteFilter] = useState('all');
  const [scheduleFilter, setScheduleFilter] = useState('all');
  const [busFilter, setBusFilter] = useState('all');
  const [permitFilter, setPermitFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // ── Query params state ─────────────────────────────────────────
  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 0,
    size: 10,
    sortBy: 'tripDate',
    sortDir: 'desc',
    search: '',
  });

  // ── Load stats & filter options once ──────────────────────────
  const loadStatistics = useCallback(() => {
    setStatsLoading(true);
    try {
      setStats(getOperatorTripStats());
    } catch (err) {
      console.error('Failed to load statistics:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadFilterOptions = useCallback(() => {
    try {
      setFilterOptions(getOperatorTripFilterOptions());
    } catch (err) {
      console.error('Failed to load filter options:', err);
    }
  }, []);

  useEffect(() => {
    loadStatistics();
    loadFilterOptions();
  }, [loadStatistics, loadFilterOptions]);

  // ── Load trips ────────────────────────────────────────────────
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
    } catch (err: any) {
      setError(err?.message || 'Failed to load trips');
      console.error('Failed to load trips:', err);
    } finally {
      setIsLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  // ── Update query params ───────────────────────────────────────
  const updateQueryParams = useCallback(
    (updates: Partial<QueryParams>) => {
      setQueryParams((prev) => {
        const next: QueryParams = { ...prev, ...updates };
        next.status =
          statusFilter !== 'all' ? (statusFilter as TripStatus) : undefined;
        next.routeId = routeFilter !== 'all' ? routeFilter : undefined;
        next.scheduleId = scheduleFilter !== 'all' ? scheduleFilter : undefined;
        next.busId = busFilter !== 'all' ? busFilter : undefined;
        next.permitId = permitFilter !== 'all' ? permitFilter : undefined;
        next.fromDate = fromDate || undefined;
        next.toDate = toDate || undefined;
        return next;
      });
    },
    [statusFilter, routeFilter, scheduleFilter, busFilter, permitFilter, fromDate, toDate],
  );

  // ── Debounce filter changes ───────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      updateQueryParams({ page: 0 });
    }, 300);
    return () => clearTimeout(timer);
  }, [
    statusFilter,
    routeFilter,
    scheduleFilter,
    busFilter,
    permitFilter,
    fromDate,
    toDate,
    updateQueryParams,
  ]);

  // ── Handlers ──────────────────────────────────────────────────
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
    (page: number) => {
      updateQueryParams({ page });
    },
    [updateQueryParams],
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      updateQueryParams({ size, page: 0 });
    },
    [updateQueryParams],
  );

  const handleView = useCallback(
    (tripId: string) => {
      router.push(`/operator/trips/${tripId}`);
    },
    [router],
  );

  const handleClearAllFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
    setRouteFilter('all');
    setScheduleFilter('all');
    setBusFilter('all');
    setPermitFilter('all');
    setFromDate('');
    setToDate('');
    setQueryParams({
      page: 0,
      size: queryParams.size,
      sortBy: 'tripDate',
      sortDir: 'desc',
      search: '',
    });
  }, [queryParams.size]);

  // ── Page actions ──────────────────────────────────────────────
  useSetPageActions(
    <button
      onClick={() => {
        loadTrips();
        loadStatistics();
      }}
      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
      Refresh
    </button>,
  );

  // ── Error state ───────────────────────────────────────────────
  if (error && trips.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-gray-900 font-medium mb-2">Failed to load trips</p>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={loadTrips}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <OperatorTripStatsCards stats={stats} loading={statsLoading} />

      {/* Filters */}
      <OperatorTripsFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        routeFilter={routeFilter}
        setRouteFilter={setRouteFilter}
        scheduleFilter={scheduleFilter}
        setScheduleFilter={setScheduleFilter}
        busFilter={busFilter}
        setBusFilter={setBusFilter}
        permitFilter={permitFilter}
        setPermitFilter={setPermitFilter}
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
        filterOptions={
          filterOptions ?? {
            statuses: [],
            routes: [],
            schedules: [],
            permits: [],
            buses: [],
          }
        }
        loading={!filterOptions}
        totalCount={pagination.totalElements}
        filteredCount={pagination.totalElements}
        onClearAll={handleClearAllFilters}
        onSearch={handleSearch}
      />

      {/* Table + Pagination */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <OperatorTripsTable
          trips={trips}
          onView={handleView}
          onSort={handleSort}
          loading={isLoading}
          currentSort={{
            field: queryParams.sortBy,
            direction: queryParams.sortDir,
          }}
        />
        <DataPagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalElements={pagination.totalElements}
          pageSize={pagination.pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          loading={isLoading}
        />
      </div>
    </div>
  );
}
