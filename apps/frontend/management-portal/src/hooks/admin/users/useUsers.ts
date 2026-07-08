'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  listUsers as apiListUsers,
  deactivateUser,
  reactivateUser as apiReactivateUser,
  AdminApiError,
} from '@/lib/api/adminUsers';
import { toAdminUser, getUserDisplayName } from '@/data/admin/users';
import type { AdminUser, UserType, UserStatus, UserStats } from '@/data/admin/users';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';

interface UseUsersOptions {
  /** The active user type tab — forces filtering by this type. */
  activeUserType: UserType;
}

// Maps the table's sort column ids to the real User entity's sortable properties.
const SORT_FIELD_MAP: Record<string, string> = {
  name: 'fullName',
  email: 'email',
  status: 'accountStatus',
  lastLogin: 'lastLoginAt',
  createdAt: 'createdAt',
};

const SEARCH_DEBOUNCE_MS = 350;

export function useUsers({ activeUserType }: UseUsersOptions) {
  const router = useRouter();
  const currentUserId = useCurrentUserId();

  // Filter/sort/pagination state
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | '__all__'>('__all__');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // List data
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState<UserStats | null>(null);

  // Actions
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'delete' | 'toggle';
    user: AdminUser | null;
  }>({ open: false, type: 'delete', user: null });
  const [actionLoading, setActionLoading] = useState(false);

  // Debounce free-text search before it hits the network.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset to page 1 whenever the tab or status filter changes.
  useEffect(() => {
    setCurrentPage(1);
  }, [activeUserType, statusFilter]);

  const sortParam = useMemo(
    () => `${SORT_FIELD_MAP[sortBy] ?? 'createdAt'},${sortOrder}`,
    [sortBy, sortOrder],
  );

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const page = await apiListUsers({
        userType: activeUserType,
        status: statusFilter !== '__all__' ? statusFilter : undefined,
        search: searchTerm || undefined,
        page: currentPage - 1,
        size: pageSize,
        sort: sortParam,
      });
      setUsers((page.content ?? []).map(toAdminUser));
      setTotalItems(page.totalElements ?? 0);
    } catch (e) {
      const message = e instanceof AdminApiError ? e.message : 'Failed to load users.';
      setLoadError(message);
      setUsers([]);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [activeUserType, statusFilter, searchTerm, currentPage, pageSize, sortParam]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const fetchStats = useCallback(async () => {
    try {
      const [totalPage, activePage, inactivePage, pendingPage] = await Promise.all([
        apiListUsers({ userType: activeUserType, size: 1 }),
        apiListUsers({ userType: activeUserType, status: 'active', size: 1 }),
        apiListUsers({ userType: activeUserType, status: 'inactive', size: 1 }),
        apiListUsers({ userType: activeUserType, status: 'pending', size: 1 }),
      ]);
      setStats({
        total: totalPage.totalElements ?? 0,
        active: activePage.totalElements ?? 0,
        inactive: inactivePage.totalElements ?? 0,
        pending: pendingPage.totalElements ?? 0,
      });
    } catch {
      // Stats are a nice-to-have — the table itself still works without them.
      setStats(null);
    }
  }, [activeUserType]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refresh = useCallback(() => {
    fetchUsers();
    fetchStats();
  }, [fetchUsers, fetchStats]);

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

  const handleView = useCallback((user: AdminUser) => router.push(`/admin/users/${user.id}`), [router]);
  const handleEdit = useCallback((user: AdminUser) => router.push(`/admin/users/${user.id}/edit`), [router]);

  const handleToggleStatus = useCallback((user: AdminUser) => {
    setConfirmDialog({ open: true, type: 'toggle', user });
  }, []);

  const handleDelete = useCallback((user: AdminUser) => {
    setConfirmDialog({ open: true, type: 'delete', user });
  }, []);

  const handleClearAll = useCallback(() => {
    setSearchInput('');
    setSearchTerm('');
    setStatusFilter('__all__');
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((value: string) => setSearchInput(value), []);

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
    const { user, type } = confirmDialog;
    if (!user) return;

    setActionLoading(true);
    try {
      if (type === 'delete') {
        await deactivateUser(user.id);
        toast.success(`${getUserDisplayName(user)} has been deactivated.`);
      } else if (user.status === 'active') {
        await deactivateUser(user.id);
        toast.success(`${getUserDisplayName(user)} has been deactivated.`);
      } else {
        await apiReactivateUser(user.id);
        toast.success(`${getUserDisplayName(user)} has been reactivated.`);
      }
      refresh();
    } catch (e) {
      const message = e instanceof AdminApiError ? e.message : 'Something went wrong. Please try again.';
      toast.error(message);
    } finally {
      setActionLoading(false);
      setConfirmDialog({ open: false, type: 'delete', user: null });
    }
  }, [confirmDialog, refresh]);

  const getDialogProps = useCallback(() => {
    if (!confirmDialog.user) return { title: '', message: '' };
    const name = getUserDisplayName(confirmDialog.user);
    if (confirmDialog.type === 'delete') {
      return {
        title: 'Deactivate User',
        message: `Deactivate "${name}"? They will immediately lose access to the platform. This can be reversed later from their profile.`,
        confirmLabel: 'Deactivate',
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
    [],
  );

  return {
    // Data
    stats,
    paginatedUsers: users,
    allFilteredUsers: users,
    totalItems,
    currentUserId,
    // State
    isLoading,
    loadError,
    searchTerm: searchInput,
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
    refresh,
    navigateToCreate: () => router.push(`/admin/users/create?type=${activeUserType}`),
  };
}
