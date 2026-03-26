'use client';

import { useRouter } from 'next/navigation';
import { ConfirmDialog } from '@busmate/ui';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { RoutesStatsCardsNew } from '@/components/mot/routes/routes-stats-cards';
import { RoutesFilterBar } from '@/components/mot/routes/routes-filter-bar';
import { RoutesTableNew } from '@/components/mot/routes/routes-table';
import { RouteActionButtons } from '@/components/mot/routes/RouteActionButtons';
import { useRoutes } from '@/components/mot/routes/useRoutes';

export default function RoutesPage() {
  const router = useRouter();
  const {
    routes,
    totalElements,
    isLoading,
    state,
    setPage,
    setPageSize,
    setSort,
    setSearch,
    setFilters,
    clearFilters,
    stats,
    filterOptions,
    activeFilterCount,
    deleteDialog,
    isDeleting,
    handleDeleteConfirm,
    handleExportAll,
    handleView,
    handleEdit,
  } = useRoutes();

  useSetPageMetadata({
    title: 'Routes',
    description: 'Manage bus routes with advanced filtering and search capabilities',
    activeItem: 'routes',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Routes' }],
  });

  useSetPageActions(
    <RouteActionButtons
      onAddRoute={() => router.push('/mot/routes/workspace')}
      onImport={() => router.push('/mot/routes/import')}
      onExportAll={handleExportAll}
      isLoading={isLoading}
    />,
  );

  return (
    <div className="space-y-6">
      <RoutesStatsCardsNew stats={stats} />

      <RoutesFilterBar
        searchValue={state.searchQuery}
        onSearchChange={setSearch}
        filters={state.filters}
        onFiltersChange={setFilters}
        onClearAll={clearFilters}
        filterOptions={filterOptions}
        activeFilterCount={activeFilterCount}
      />

      <RoutesTableNew
        data={routes}
        totalItems={totalElements}
        page={state.page}
        pageSize={state.pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        sortColumn={state.sortColumn}
        sortDirection={state.sortDirection}
        onSort={setSort}
        loading={isLoading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={deleteDialog.open}
      />

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.setOpen}
        title="Delete Route"
        description={`Are you sure you want to delete route "${deleteDialog.data?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
      />
    </div>
  );
}
