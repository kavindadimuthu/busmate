'use client';

import { RefreshCw, Info } from 'lucide-react';
import { Button } from '@busmate/ui';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { FleetStatsCards } from '@/components/operator/fleet/FleetStatsCards';
import { FleetFilterBar } from '@/components/operator/fleet/FleetFilterBar';
import { FleetTable } from '@/components/operator/fleet/FleetTable';
import { useFleetManagement } from '@/hooks/operator/fleet/useFleetManagement';

export default function FleetManagementPage() {
  useSetPageMetadata({
    title: 'Fleet Management',
    description: 'View details of all buses in your fleet. Contact NTC to register or update bus information.',
    activeItem: 'fleetmanagement',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Fleet Management' }],
  });

  const {
    state, buses, totalItems, stats, isLoading, statsLoading, error,
    activeFilterCount, setPage, setPageSize, setSort, setSearch, setFilters,
    clearFilters, handleRefresh, handleView, loadBuses,
  } = useFleetManagement();

  useSetPageActions(
    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
      <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
      Refresh
    </Button>,
  );

  return (
    <div className="space-y-6">
      <FleetStatsCards stats={stats} loading={statsLoading} />

      <FleetFilterBar
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
          <button onClick={loadBuses} className="shrink-0 underline hover:no-underline text-xs font-medium">
            Retry
          </button>
        </div>
      )}

      <FleetTable
        data={buses} totalItems={totalItems} page={state.page} pageSize={state.pageSize}
        onPageChange={setPage} onPageSizeChange={setPageSize}
        sortColumn={state.sortColumn} sortDirection={state.sortDirection}
        onSort={setSort} loading={isLoading} onView={handleView}
      />

      <div className="flex items-start gap-2.5 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 text-sm text-primary">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary/80" />
        <p>
          <span className="font-semibold">Read-only view:</span>{' '}
          Fleet registration and modifications are managed by the National Transport Commission (NTC).
          Please contact NTC for any changes to your fleet.
        </p>
      </div>
    </div>
  );
}
