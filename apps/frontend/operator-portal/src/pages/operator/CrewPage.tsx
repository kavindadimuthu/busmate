import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { useCrewManagement } from '@/hooks/operator/crew/useCrewManagement';
import {
  CrewStatsCards,
  CrewFilterBar,
  CrewTable,
  CrewActionButtons,
} from '@/components/operator/crew';

// Ported from management-portal app/operator/crew/page.tsx — body unchanged.
export default function CrewPage() {
  useSetPageMetadata({
    title: 'Crew Management',
    description: 'Manage the conductors employed by your organization',
    activeItem: 'crew',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Crew Management' }],
  });

  const {
    state, crew, totalItems, stats, isLoading, error, activeFilterCount,
    setPage, setPageSize, setSort, setSearch, setFilters, clearFilters,
    handleView, handleAdd, handleRefresh,
  } = useCrewManagement();

  useSetPageActions(
    <CrewActionButtons onAddConductor={handleAdd} isLoading={isLoading} />,
  );

  return (
    <div className="space-y-6">
      <CrewStatsCards stats={stats} loading={isLoading} />

      <CrewFilterBar
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
          <button onClick={handleRefresh} className="shrink-0 underline hover:no-underline text-xs font-medium">
            Retry
          </button>
        </div>
      )}

      <CrewTable
        data={crew}
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
    </div>
  );
}
