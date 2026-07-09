'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@busmate/ui';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { TripStatsCards, TripFilterBar, TripTable } from '@/components/operator/trips';
import { useTripsManagement } from '@/hooks/operator/trips/useTripsManagement';

export default function OperatorTripsPage() {
  useSetPageMetadata({
    title: 'My Trips',
    description: 'View and manage all trips operated by your fleet',
    activeItem: 'trips',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Trips' }],
  });

  const {
    state, trips, totalItems, stats, isLoading, statsLoading, error,
    activeFilterCount, setPage, setPageSize, setSort, setSearch, setFilters,
    clearFilters, handleRefresh, handleView, loadTrips,
  } = useTripsManagement();

  useSetPageActions(
    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
      <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
      Refresh
    </Button>,
  );

  return (
    <div className="space-y-6">
      <TripStatsCards stats={stats} loading={statsLoading} />

      <TripFilterBar
        searchValue={state.searchQuery}
        onSearchChange={setSearch}
        filters={state.filters}
        onFiltersChange={setFilters}
        onClearAll={clearFilters}
        activeFilterCount={activeFilterCount}
      />

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3 text-sm text-destructive">
          <div className="flex-1">
            <span className="font-semibold">Error: </span>{error}
          </div>
          <button onClick={loadTrips} className="shrink-0 underline hover:no-underline text-xs font-medium">
            Retry
          </button>
        </div>
      )}

      <TripTable
        data={trips} totalItems={totalItems} page={state.page} pageSize={state.pageSize}
        onPageChange={setPage} onPageSizeChange={setPageSize}
        sortColumn={state.sortColumn} sortDirection={state.sortDirection}
        onSort={setSort} loading={isLoading} onView={handleView}
      />
    </div>
  );
}
