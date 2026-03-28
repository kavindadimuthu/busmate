'use client';

import { useRouter } from 'next/navigation';
import { ConfirmDialog } from '@busmate/ui';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';

import { PermitsStatsCards } from '@/components/mot/permits/PermitsStatsCards';
import { PermitsFilterBar } from '@/components/mot/permits/PermitsFilterBar';
import { PermitsTable } from '@/components/mot/permits/PermitsTable';
import { PermitActionButtons } from '@/components/mot/permits/PermitActionButtons';
import { usePermits } from '@/hooks/mot/permits/usePermits';

export default function PassengerServicePermitsPage() {
  const router = useRouter();

  const {
    state,
    setPage,
    setPageSize,
    setSort,
    setSearch,
    setFilters,
    clearFilters,
    permits,
    totalElements,
    statistics,
    filterOptions,
    isLoading,
    activeFilterCount,
    deleteDialog,
    isDeleting,
    handleDeleteConfirm,
    handleView,
    handleEdit,
    handleAssignBus,
    handleExport,
    handleImport,
  } = usePermits();

  useSetPageMetadata({
    title: 'Passenger Service Permits Management',
    description: 'Manage and monitor passenger service permits for all operators',
    activeItem: 'passenger-service-permits',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Permits' }],
  });

  useSetPageActions(
    <PermitActionButtons
      onAddPermit={() => router.push('/mot/passenger-service-permits/add-new')}
      onImportPermits={handleImport}
      onExportAll={handleExport}
      isLoading={isLoading}
    />,
  );

  return (
    <div className="space-y-6">
      <PermitsStatsCards stats={statistics} />

      <PermitsFilterBar
        searchValue={state.searchQuery}
        onSearchChange={setSearch}
        filters={state.filters}
        onFiltersChange={setFilters}
        onClearAll={clearFilters}
        filterOptions={filterOptions}
        activeFilterCount={activeFilterCount}
      />

      <PermitsTable
        data={permits}
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
        onAssignBus={handleAssignBus}
      />

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.setOpen}
        title="Delete Permit"
        description={`Are you sure you want to delete permit "${deleteDialog.data?.permitNumber}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
      />
    </div>
  );
}