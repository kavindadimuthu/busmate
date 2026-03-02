'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { UserStatsCards } from '@/components/admin/users/UserStatsCards';
import { UserActionButtons } from '@/components/admin/users/UserActionButtons';
import { UserAdvancedFilters } from '@/components/admin/users/UserAdvancedFilters';
import { UsersTable } from '@/components/admin/users/UsersTable';
import { ConfirmDialog } from '@/components/admin/users/ConfirmDialog';
import { DataPagination } from '@/components/shared/DataPagination';
import {
  getUserStatsData,
  getFilteredUsers,
  updateUserStatus,
  deleteUserById,
  getUserDisplayName,
} from '@/data/admin/users';
import type { SystemUser, UserType, UserStatus, UserFiltersState } from '@/data/admin/users';

// ── Main Component ────────────────────────────────────────────────

export default function UsersPage() {
  const router = useRouter();

  // ── State ───────────────────────────────────────────────────────

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<UserType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);

  // Dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'delete' | 'toggle';
    user: SystemUser | null;
  }>({ open: false, type: 'delete', user: null });
  const [actionLoading, setActionLoading] = useState(false);

  // ── Data computation ────────────────────────────────────────────

  // Get statistics
  const stats = useMemo(() => getUserStatsData(), []);

  // Build filters object
  const filters: UserFiltersState = useMemo(
    () => ({
      search: searchTerm,
      userType: userTypeFilter,
      status: statusFilter,
      sortBy,
      sortOrder,
    }),
    [searchTerm, userTypeFilter, statusFilter, sortBy, sortOrder]
  );

  // Get all filtered users
  const allFilteredUsers = useMemo(() => getFilteredUsers(filters), [filters]);

  // Get all users (for total count)
  const allUsers = useMemo(
    () => getFilteredUsers({ search: '', userType: 'all', status: 'all', sortBy: 'createdAt', sortOrder: 'desc' }),
    []
  );

  // Pagination calculations
  const totalPages = Math.ceil(allFilteredUsers.length / pageSize);
  const startIndex = currentPage * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedUsers = allFilteredUsers.slice(startIndex, endIndex);

  // ── Page metadata and actions ───────────────────────────────────

  useSetPageMetadata({
    title: 'User Management',
    description: 'Manage users, permissions, and account settings across the platform',
    activeItem: 'users',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'User Management' }],
  });

  useSetPageActions(
    <UserActionButtons
      onAddUser={() => router.push('/admin/users/create')}
      isLoading={isLoading}
    />
  );

  // ── Handlers ────────────────────────────────────────────────────

  const handleSort = useCallback((column: string) => {
    setSortBy((prev) => {
      if (prev === column) {
        setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortOrder('asc');
      return column;
    });
    setCurrentPage(0); // Reset to first page on sort change
  }, []);

  const handleView = useCallback(
    (user: SystemUser) => {
      router.push(`/admin/users/${user.id}`);
    },
    [router]
  );

  const handleEdit = useCallback(
    (user: SystemUser) => {
      router.push(`/admin/users/${user.id}/edit`);
    },
    [router]
  );

  const handleToggleStatus = useCallback((user: SystemUser) => {
    setConfirmDialog({ open: true, type: 'toggle', user });
  }, []);

  const handleDelete = useCallback((user: SystemUser) => {
    setConfirmDialog({ open: true, type: 'delete', user });
  }, []);

  const handleClearAll = useCallback(() => {
    setSearchTerm('');
    setUserTypeFilter('all');
    setStatusFilter('all');
    setCurrentPage(0);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(0); // Reset to first page when page size changes
  }, []);

  const handleConfirmAction = useCallback(async () => {
    if (!confirmDialog.user) return;
    setActionLoading(true);
    try {
      if (confirmDialog.type === 'delete') {
        await deleteUserById(confirmDialog.user.id);
      } else {
        const newStatus = confirmDialog.user.status === 'active' ? 'inactive' : 'active';
        await updateUserStatus(confirmDialog.user.id, newStatus);
      }
    } finally {
      setActionLoading(false);
      setConfirmDialog({ open: false, type: 'delete', user: null });
    }
  }, [confirmDialog]);

  const getDialogProps = () => {
    if (!confirmDialog.user) return { title: '', message: '' };
    const name = getUserDisplayName(confirmDialog.user);
    if (confirmDialog.type === 'delete') {
      return {
        title: 'Delete User',
        message: `Are you sure you want to permanently delete "${name}" (${confirmDialog.user.id})? This action cannot be undone.`,
        confirmLabel: 'Delete',
        variant: 'danger' as const,
      };
    }
    const willActivate = confirmDialog.user.status !== 'active';
    return {
      title: willActivate ? 'Activate User' : 'Deactivate User',
      message: willActivate
        ? `Activate "${name}"? They will be able to access the platform again.`
        : `Deactivate "${name}"? They will lose access to the platform until reactivated.`,
      confirmLabel: willActivate ? 'Activate' : 'Deactivate',
      variant: (willActivate ? 'info' : 'warning') as 'info' | 'warning',
    };
  };

  // Reset to first page when filters change
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(0);
  }, []);

  const handleUserTypeChange = useCallback((value: UserType | 'all') => {
    setUserTypeFilter(value);
    setCurrentPage(0);
  }, []);

  const handleStatusChange = useCallback((value: UserStatus | 'all') => {
    setStatusFilter(value);
    setCurrentPage(0);
  }, []);

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <UserStatsCards stats={stats} loading={isLoading} />

      {/* Advanced Filters */}
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

      {/* Users Table with Pagination */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
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

        {/* Pagination */}
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

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, type: 'delete', user: null })}
        onConfirm={handleConfirmAction}
        loading={actionLoading}
        {...getDialogProps()}
      />
    </div>
  );
}

