'use client';

import { useRouter } from 'next/navigation';
import { ConfirmDialog } from '@busmate/ui';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { StaffStatsCards } from '@/components/mot/staff/StaffStatsCards';
import { StaffFilterBar } from '@/components/mot/staff/StaffFilterBar';
import { StaffTable } from '@/components/mot/staff/StaffTable';
import { StaffTypeTabs, StaffActionButtons } from '@/components/mot/staff';
import { useStaffManagement } from '@/hooks/mot/staff/useStaffManagement';

export default function StaffManagementPage() {
  const router = useRouter();
  const {
    paginatedStaff,
    totalItems,
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
    activeTab,
    handleTabChange,
    tabCounts,
    deleteDialog,
    isDeleting,
    handleDeleteConfirm,
    handleExportAll,
    handleView,
    handleEdit,
  } = useStaffManagement();

  useSetPageMetadata({
    title: 'Staff Management',
    description: 'Manage timekeepers, inspectors, and other staff',
    activeItem: 'staff',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Staff Management' }],
  });

  useSetPageActions(
    <StaffActionButtons
      onAddStaff={() => router.push('/mot/staff/create')}
      onExportAll={handleExportAll}
    />,
  );

  return (
    <div className="space-y-6">
      <StaffStatsCards stats={stats} />

      <StaffTypeTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        counts={tabCounts}
      />

      <StaffFilterBar
        searchValue={state.searchQuery}
        onSearchChange={setSearch}
        filters={state.filters}
        onFiltersChange={setFilters}
        onClearAll={clearFilters}
        filterOptions={filterOptions}
        activeFilterCount={activeFilterCount}
      />

      <StaffTable
        data={paginatedStaff}
        totalItems={totalItems}
        page={state.page}
        pageSize={state.pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        sortColumn={state.sortColumn}
        sortDirection={state.sortDirection}
        onSort={setSort}
        loading={false}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={deleteDialog.open}
      />

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.setOpen}
        title="Delete Staff Member"
        description={`Are you sure you want to delete "${deleteDialog.data?.fullName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
      />
    </div>
  );
}