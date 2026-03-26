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
import { DataPagination } from '@/components/shared/DataPagination';

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

      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <StaffTable
          staff={paginatedStaff}
          mode={activeTab}
          loading={loading}
          currentSort={sort}
          onSort={handleSort}
        />
        <DataPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalElements={filteredStaff.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
          loading={loading}
        />
      </div>

      <p className="text-xs text-muted-foreground/70 text-center">
        Staff records are managed by BusMate administration. This view is read-only. Contact support if you need to update staff information.
      </p>
    </div>
  );
}
