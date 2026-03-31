'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getUserStatsData,
  getFilteredUsers,
  updateUserStatus,
  deleteUserById,
  getUserDisplayName,
} from '@/data/admin/users';
import type { SystemUser, UserType, UserStatus, UserFiltersState } from '@/data/admin/users';

interface UseUsersOptions {
  /** The active user type tab — forces filtering by this type. */
  activeUserType: UserType;
}

export function useUsers({ activeUserType }: UseUsersOptions) {
  const router = useRouter();

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const userTypeFilter: UserType = activeUserType;
  const [statusFilter, setStatusFilter] = useState<UserStatus | '__all__'>('__all__');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isLoading] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'delete' | 'toggle';
    user: SystemUser | null;
  }>({ open: false, type: 'delete', user: null });
  const [actionLoading, setActionLoading] = useState(false);

  // Data computation
  const stats = useMemo(() => getUserStatsData(activeUserType), [activeUserType]);

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

  const allFilteredUsers = useMemo(() => getFilteredUsers(filters), [filters]);

  const allUsers = useMemo(
    () =>
      getFilteredUsers({
        search: '',
        userType: activeUserType,
        status: '__all__',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
    [activeUserType]
  );

  const totalPages = Math.ceil(allFilteredUsers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedUsers = allFilteredUsers.slice(startIndex, startIndex + pageSize);

  // Handlers
  const handleSort = useCallback((column: string) => {
    setSortBy((prev) => {
      if (prev === column) {
        setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortOrder('asc');
      return column;
    });
    setCurrentPage(1);
  }, []);

  const handleView = useCallback(
    (user: SystemUser) => router.push(`/admin/users/${user.id}`),
    [router]
  );

  const handleEdit = useCallback(
    (user: SystemUser) => router.push(`/admin/users/${user.id}/edit`),
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
    setStatusFilter('__all__');
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleStatusChange = useCallback((value: UserStatus | '__all__') => {
    setStatusFilter(value);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => setCurrentPage(page), []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
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

  const getDialogProps = useCallback(() => {
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
  }, [confirmDialog]);

  const closeDialog = useCallback(
    () => setConfirmDialog({ open: false, type: 'delete', user: null }),
    []
  );

  return {
    // Data
    stats,
    paginatedUsers,
    allFilteredUsers,
    allUsers,
    totalPages,
    // State
    isLoading,
    searchTerm,
    userTypeFilter,
    statusFilter,
    sortBy,
    sortOrder,
    currentPage,
    pageSize,
    confirmDialog,
    actionLoading,
    // Handlers
    handleSort,
    handleView,
    handleEdit,
    handleToggleStatus,
    handleDelete,
    handleClearAll,
    handleSearchChange,
    handleStatusChange,
    handlePageChange,
    handlePageSizeChange,
    handleConfirmAction,
    getDialogProps,
    closeDialog,
    // Derived from router
    navigateToCreate: () => router.push('/admin/users/create'),
  };
}
