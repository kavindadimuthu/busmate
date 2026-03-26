'use client';

import { useRouter } from 'next/navigation';
import { ConfirmDialog } from '@busmate/ui';

import { OperatorsStatsCards } from '@/components/mot/operators/operators-stats-cards';
import { OperatorsFilterBar } from '@/components/mot/operators/operators-filter-bar';
import { OperatorsTable } from '@/components/mot/operators/operators-table';
import { OperatorActionButtons } from '@/components/mot/operators';
import { useSetPageActions, useSetPageMetadata } from '@/context/PageContext';
import { useOperators } from '@/components/mot/operators/useOperators';

export default function OperatorsPage() {
  const router = useRouter();

  const {
    filteredTableData,
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
  } = useOperators();

  useSetPageMetadata({
    title: 'Operators',
    description: 'Manage bus operators and their details',
    activeItem: 'operators',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Operators' }],
  });

  useSetPageActions(
    <OperatorActionButtons
      onAddOperator={() => router.push('/mot/operators/add-new')}
      onImportOperators={() => router.push('/mot/operators/import')}
      onExportAll={handleExportAll}
      isLoading={isLoading}
    />,
  );

  return (
    <div className="space-y-6">
      <OperatorsStatsCards stats={stats} />

      <OperatorsFilterBar
        searchValue={state.searchQuery}
        onSearchChange={setSearch}
        filters={state.filters}
        onFiltersChange={setFilters}
        onClearAll={clearFilters}
        filterOptions={filterOptions}
        activeFilterCount={activeFilterCount}
      />

      <OperatorsTable
        data={filteredTableData.data}
        totalItems={filteredTableData.totalItems}
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
        title="Delete Operator"
        description={`Are you sure you want to delete "${deleteDialog.data?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
      />
    </div>
  );
}
