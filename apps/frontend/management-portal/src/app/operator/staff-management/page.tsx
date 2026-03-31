'use client';

import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { useStaffManagement } from '@/hooks/useStaffManagement';
import {
  StaffStatsCards,
  StaffTypeTabs,
  StaffAdvancedFilters,
  StaffTable,
  StaffActionButtons,
} from '@/components/operator/staff';

export default function StaffManagementPage() {
  useSetPageMetadata({
    title: 'Staff Management',
    description: 'View drivers and conductors employed by your organization',
    activeItem: 'staff',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Staff Management' }],
  });

  const {
    stats,
    loading,
    activeTab,
    searchTerm,
    statusFilter,
    shiftFilter,
    sort,
    currentPage,
    setCurrentPage,
    pageSize,
    tabCounts,
    filteredStaff,
    paginatedStaff,
    totalPages,
    tabTotalCount,
    handleTabChange,
    handleSearchChange,
    handleStatusChange,
    handleShiftChange,
    handleClearAllFilters,
    handleSort,
    handlePageSizeChange,
    handleExportAll,
  } = useStaffManagement();

  useSetPageActions(
    <StaffActionButtons onExportAll={handleExportAll} isLoading={loading} />,
  );

  return (
    <div className="space-y-6">
      <StaffStatsCards stats={stats} loading={loading} />

      <StaffTypeTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        counts={tabCounts}
      />

      <StaffAdvancedFilters
        searchTerm={searchTerm}
        setSearchTerm={handleSearchChange}
        statusFilter={statusFilter}
        setStatusFilter={handleStatusChange}
        shiftFilter={shiftFilter}
        setShiftFilter={handleShiftChange}
        loading={loading}
        totalCount={tabTotalCount}
        filteredCount={filteredStaff.length}
        onClearAll={handleClearAllFilters}
      />

      <StaffTable
          staff={paginatedStaff}
          mode={activeTab}
          loading={loading}
          sortColumn={sort.field}
          sortDirection={sort.direction}
          onSort={handleSort}
          totalItems={filteredStaff.length}
          page={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
        />

      <p className="text-xs text-muted-foreground/70 text-center">
        Staff records are managed by BusMate administration. This view is read-only. Contact support if you need to update staff information.
      </p>
    </div>
  );
}
