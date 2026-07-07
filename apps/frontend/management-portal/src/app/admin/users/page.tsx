'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { UserTypeTabs } from '@/components/admin/users/UserTypeTabs';
import { UserStatsCards } from '@/components/admin/users/UserStatsCards';
import { UserActionButtons } from '@/components/admin/users/UserActionButtons';
import { UserAdvancedFilters } from '@/components/admin/users/UserAdvancedFilters';
import { UsersTable } from '@/components/admin/users/UsersTable';
import { ConfirmDialog } from '@/components/admin/users/ConfirmDialog';
import { useUsers } from '@/hooks/admin/users/useUsers';
import { getUserStatsData } from '@/data/admin/users';
import type { UserType } from '@/data/admin/users';

// ── Constants ────────────────────────────────────────────────────

const VALID_TABS = new Set<string>(['mot', 'timekeeper', 'operator', 'conductor', 'driver', 'passenger']);
const DEFAULT_TAB: UserType = 'mot';

// ── Component ────────────────────────────────────────────────────

export default function UsersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Derive active tab from URL query param, default to 'mot'
  const rawTab = searchParams.get('tab');
  const activeTab: UserType = rawTab && VALID_TABS.has(rawTab) ? (rawTab as UserType) : DEFAULT_TAB;

  // Global stats for tab counts
  const globalStats = useMemo(() => getUserStatsData(), []);

  const handleTabChange = useCallback(
    (tab: UserType) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tab);
      router.push(`/admin/users?${params.toString()}`);
    },
    [router, searchParams],
  );

  const {
    stats, paginatedUsers, allFilteredUsers, isLoading, searchTerm,
    statusFilter, sortBy, sortOrder, currentPage, pageSize, confirmDialog,
    actionLoading, handleSort, handleView, handleEdit, handleToggleStatus, handleDelete,
    handleClearAll, handleSearchChange, handleStatusChange,
    handlePageChange, handlePageSizeChange, handleConfirmAction, getDialogProps,
    closeDialog, navigateToCreate,
  } = useUsers({ activeUserType: activeTab });

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
      <UserTypeTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        counts={globalStats.byType}
      />

      <UserStatsCards stats={stats} loading={isLoading} activeUserType={activeTab} />

      <UserAdvancedFilters
        searchTerm={searchTerm}
        setSearchTerm={handleSearchChange}
        statusFilter={statusFilter}
        setStatusFilter={handleStatusChange}
        onClearAll={handleClearAll}
      />

      <UsersTable
          users={paginatedUsers}
          loading={isLoading}
          sortColumn={sortBy}
          sortDirection={sortOrder}
          onSort={handleSort}
          onView={handleView}
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDelete}
          totalItems={allFilteredUsers.length}
          page={currentPage}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          activeFilters={{
            search: searchTerm,
            status: statusFilter !== '__all__' ? statusFilter : undefined,
          }}
        />

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

