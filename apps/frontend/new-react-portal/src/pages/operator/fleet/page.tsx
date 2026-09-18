'use client';

import { RefreshCw, Plus } from 'lucide-react';
import { useRouter } from '@/lib/router';
import { Button } from '@busmate/ui';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { FleetStatsCards } from '@/components/operator/fleet/FleetStatsCards';
import { FleetFilterBar } from '@/components/operator/fleet/FleetFilterBar';
import { FleetTable } from '@/components/operator/fleet/FleetTable';
import { useFleetManagement } from '@/hooks/operator/fleet/useFleetManagement';

export default function FleetManagementPage() {
  useSetPageMetadata({
    title: 'Fleet Management',
    description: 'Register your buses and keep their details, seat layout, photos and documents current',
    activeItem: 'fleet',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Fleet Management' }],
  });

  const {
    state, buses, totalItems, stats, isLoading, statsLoading, error,
    activeFilterCount, setPage, setPageSize, setSort, setSearch, setFilters,
    clearFilters, handleRefresh, handleView, loadBuses,
  } = useFleetManagement();

  const router = useRouter();
  useSetPageActions(
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
        <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
      <Button size="sm" onClick={() => router.push('/operator/fleet/create')}>
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        Register Bus
      </Button>
    </div>,
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

    </div>
  );
}
