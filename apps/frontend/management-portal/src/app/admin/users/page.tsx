'use client';

import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { UserStatsCards } from '@/components/admin/users/UserStatsCards';
import { UserActionButtons } from '@/components/admin/users/UserActionButtons';
import { UserAdvancedFilters } from '@/components/admin/users/UserAdvancedFilters';
import { UsersTable } from '@/components/admin/users/UsersTable';
import { ConfirmDialog } from '@/components/admin/users/ConfirmDialog';
import { DataPagination } from '@/components/shared/DataPagination';
import { useUsers } from '@/components/admin/users/useUsers';

export default function UsersPage() {
  const {
    stats, paginatedUsers, allFilteredUsers, allUsers, totalPages, isLoading, searchTerm,
    userTypeFilter, statusFilter, sortBy, sortOrder, currentPage, pageSize, confirmDialog,
    actionLoading, handleSort, handleView, handleEdit, handleToggleStatus, handleDelete,
    handleClearAll, handleSearchChange, handleUserTypeChange, handleStatusChange,
    handlePageChange, handlePageSizeChange, handleConfirmAction, getDialogProps,
    closeDialog, navigateToCreate,
  } = useUsers();

  useSetPageMetadata({
    title: 'User Management',
    description: 'Manage users, permissions, and account settings across the platform',
    activeItem: 'users',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'User Management' }],
  });

  useSetPageActions(
    <UserActionButtons onAddUser={navigateToCreate} isLoading={isLoading} />
  );

  return (
    <div className="space-y-6">
      <UserStatsCards stats={stats} loading={isLoading} />

      <UserAdvancedFilters
        searchTerm={searchTerm}
        setSearchTerm={handleSearchChange}
        userTypeFilter={userTypeFilter}
        setUserTypeFilter={handleUserTypeChange}
        statusFilter={statusFilter}
        setStatusFilter={handleStatusChange}
        loading={isLoading}
        totalCount={allUsers.length}
        filteredCount={allFilteredUsers.length}
        onClearAll={handleClearAll}
      />

      <div className="bg-card shadow-sm rounded-xl border border-border overflow-hidden">
        <UsersTable
          users={paginatedUsers}
          loading={isLoading}
          currentSort={{ sortBy, sortOrder }}
          onSort={handleSort}
          onView={handleView}
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDelete}
          activeFilters={{
            search: searchTerm,
            userType: userTypeFilter !== 'all' ? userTypeFilter : undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
          }}
        />
        {allFilteredUsers.length > 0 && (
          <DataPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={allFilteredUsers.length}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            loading={isLoading}
          />
        )}
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        onClose={closeDialog}
        onConfirm={handleConfirmAction}
        loading={actionLoading}
        {...getDialogProps()}
      />
    </div>
  );
}

