'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Info, RefreshCw } from 'lucide-react';
import { useDataTable, Button } from '@busmate/ui';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { FleetStatsCardsNew } from '@/components/operator/fleet/fleet-stats-cards';
import { FleetFilterBar, type FleetFilters } from '@/components/operator/fleet/fleet-filter-bar';
import { FleetTableNew } from '@/components/operator/fleet/fleet-table';
import {
  getOperatorBuses,
  getFleetStatistics,
  type OperatorBus,
  type FleetStatistics,
} from '@/data/operator/buses';

const INITIAL_FILTERS: FleetFilters = { status: '__all__', serviceType: '__all__' };

export default function FleetManagementPage() {
  const router = useRouter();

  // ── Table state (pagination, sort, filters) ──────────────────────
  const { state, setPage, setPageSize, setSort, setSearch, setFilters, clearFilters } =
    useDataTable<FleetFilters>({
      initialPageSize: 10,
      initialSort: { column: 'plateNumber', direction: 'asc' },
      initialFilters: INITIAL_FILTERS,
    });

  // ── Server data ──────────────────────────────────────────────────
  const [buses,        setBuses]        = useState<OperatorBus[]>([]);
  const [totalItems,   setTotalItems]   = useState(0);
  const [stats,        setStats]        = useState<FleetStatistics>({
    totalBuses: 0, activeBuses: 0, inactiveBuses: 0,
    maintenanceBuses: 0, totalCapacity: 0, averageCapacity: 0,
  });
  const [isLoading,    setIsLoading]    = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  useSetPageMetadata({
    title: 'Fleet Management',
    description: 'View details of all buses in your fleet. Contact NTC to register or update bus information.',
    activeItem: 'fleetmanagement',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Fleet Management' }],
  });

  // ── Load statistics (once) ────────────────────────────────────────
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

  // ── Load buses ────────────────────────────────────────────────────
  const loadBuses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getOperatorBuses({
        page: state.page - 1, // useDataTable is 1-based; API is 0-based
        size: state.pageSize,
        search: state.searchQuery,
        status: state.filters.status === '__all__' ? 'ALL' : state.filters.status,
        serviceType: state.filters.serviceType === '__all__' ? 'ALL' : state.filters.serviceType,
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

  // ── Page-level actions ───────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    await Promise.all([loadStatistics(), loadBuses()]);
  }, [loadStatistics, loadBuses]);

  useSetPageActions(
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isLoading}
    >
      <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
      Refresh
    </Button>,
  );

  // ── Handlers ─────────────────────────────────────────────────────
  const handleView = useCallback((bus: OperatorBus) => {
    router.push(`/operator/fleet-management/${bus.id}`);
  }, [router]);

  const activeFilterCount =
    (state.filters.status !== '__all__' ? 1 : 0) +
    (state.filters.serviceType !== '__all__' ? 1 : 0);

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Stats */}
      <FleetStatsCardsNew stats={stats} loading={statsLoading} />

      {/* Search & Filters */}
      <FleetFilterBar
        searchValue={state.searchQuery}
        onSearchChange={setSearch}
        filters={state.filters}
        onFiltersChange={setFilters}
        onClearAll={clearFilters}
        activeFilterCount={activeFilterCount}
      />

      {/* Error Banner */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3 text-sm text-destructive">
          <div className="flex-1">
            <span className="font-semibold">Error: </span>{error}
          </div>
          <button
            onClick={loadBuses}
            className="shrink-0 underline hover:no-underline text-xs font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <FleetTableNew
        data={buses}
        totalItems={totalItems}
        page={state.page}
        pageSize={state.pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        sortColumn={state.sortColumn}
        sortDirection={state.sortDirection}
        onSort={setSort}
        loading={isLoading}
        onView={handleView}
      />

      {/* Read-only notice */}
      <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
        <p>
          <span className="font-semibold">Read-only view:</span>{' '}
          Fleet registration and modifications are managed by the National Transport Commission (NTC).
          Please contact NTC for any changes to your fleet.
        </p>
      </div>

    </div>
  );
}
