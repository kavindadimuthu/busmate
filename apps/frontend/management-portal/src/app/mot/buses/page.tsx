'use client';

import { useRouter } from 'next/navigation';
import { ConfirmDialog } from '@busmate/ui';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';

import { BusesStatsCards } from '@/components/mot/buses/BusesStatsCards';
import { BusesFilterBar } from '@/components/mot/buses/BusesFilterBar';
import { BusesTable } from '@/components/mot/buses/BusesTable';
import { BusActionButtons } from '@/components/mot/buses/BusActionButtons';
import { useBuses } from '@/hooks/mot/buses/useBuses';

export default function BusesPage() {
  const router = useRouter();
  const {
    buses,
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
    handleAssignRoute,
  } = useBuses();

  useSetPageMetadata({
    title: 'Buses Management',
    description: 'Manage and monitor bus fleet across all operators',
    activeItem: 'buses',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Buses' }],
  });

  useSetPageActions(
    <BusActionButtons
      onAddBus={() => router.push('/mot/buses/create')}
      onImportBuses={() => router.push('/mot/buses/import')}
      onExportAll={handleExportAll}
      isLoading={isLoading}
    />,
  );

  return (
    <div className="space-y-6">
      <BusesStatsCards stats={stats} />

      <BusesFilterBar
        searchValue={state.searchQuery}
        onSearchChange={setSearch}
        filters={state.filters}
        onFiltersChange={setFilters}
        onClearAll={clearFilters}
        filterOptions={filterOptions}
        activeFilterCount={activeFilterCount}
      />

      <BusesTable
        data={buses}
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
        onAssignRoute={handleAssignRoute}
      />

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.setOpen}
        title="Delete Bus"
        description={`Are you sure you want to delete bus "${deleteDialog.data?.ntcRegistrationNumber}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
      />
    </div>
  );
}