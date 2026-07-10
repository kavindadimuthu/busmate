'use client';

import { useSearchParams, useRouter } from '@/lib/router';
import { useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { UserTypeTabs } from '@/components/admin/users/UserTypeTabs';
import { UserStatsCards } from '@/components/admin/users/UserStatsCards';
import { UserActionButtons } from '@/components/admin/users/UserActionButtons';
import { UserAdvancedFilters } from '@/components/admin/users/UserAdvancedFilters';
import { UsersTable } from '@/components/admin/users/UsersTable';
import { ConfirmDialog } from '@/components/admin/users/ConfirmDialog';
import { useUsers } from '@/hooks/admin/users/useUsers';
import { useUserTypeCounts } from '@/hooks/admin/users/useUserTypeCounts';
import { MANAGED_USER_TYPES } from '@/lib/api/adminUsers';
import type { UserType } from '@/data/admin/users';

// ── Constants ────────────────────────────────────────────────────

const VALID_TABS = new Set<string>(MANAGED_USER_TYPES);
const DEFAULT_TAB: UserType = 'admin';

// ── Component ────────────────────────────────────────────────────

export default function UsersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Derive active tab from URL query param, default to 'admin'
  const rawTab = searchParams.get('tab');
  const activeTab: UserType = rawTab && VALID_TABS.has(rawTab) ? (rawTab as UserType) : DEFAULT_TAB;

  // Per-type counts for the tab badges
  const typeCounts = useUserTypeCounts();

  const handleTabChange = useCallback(
    (tab: UserType) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tab);
      router.push(`/admin/users?${params.toString()}`);
    },
    [router, searchParams],
  );

  const {
    stats, paginatedUsers, totalItems, isLoading, loadError, currentUserId, searchTerm,
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
        counts={typeCounts}
      />

      <UserStatsCards stats={stats} loading={isLoading && !stats} activeUserType={activeTab} />

      <UserAdvancedFilters
        searchTerm={searchTerm}
        setSearchTerm={handleSearchChange}
        statusFilter={statusFilter}
        setStatusFilter={handleStatusChange}
        onClearAll={handleClearAll}
      />

      {loadError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-destructive/20 bg-destructive/10 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {loadError}
        </div>
      )}

      <UsersTable
          users={paginatedUsers}
          currentUserId={currentUserId}
          loading={isLoading}
          sortColumn={sortBy}
          sortDirection={sortOrder}
          onSort={handleSort}
          onView={handleView}
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDelete}
          totalItems={totalItems}
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
