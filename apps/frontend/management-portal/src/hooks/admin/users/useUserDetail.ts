'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  getUser,
  getUserPermissions,
  deactivateUser,
  reactivateUser as apiReactivateUser,
  AdminApiError,
} from '@/lib/api/adminUsers';
import type { UserPermissionsResponse } from '@/lib/api/adminUsers';
import { toAdminUser, getUserDisplayName } from '@/data/admin/users';
import type { AdminUser } from '@/data/admin/users';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';

export function useUserDetail() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const currentUserId = useCurrentUserId();

  const [user, setUser] = useState<AdminUser | null>(null);
  const [permissions, setPermissions] = useState<UserPermissionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'delete' | 'toggle';
  }>({ open: false, type: 'delete' });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [response, permissionsResponse] = await Promise.all([
        getUser(userId),
        getUserPermissions(userId).catch(() => null),
      ]);
      setUser(toAdminUser(response));
      setPermissions(permissionsResponse);
    } catch (e) {
      setUser(null);
      setLoadError(e instanceof AdminApiError ? e.message : 'Failed to load user.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleBack = useCallback(() => router.push('/admin/users'), [router]);
  const handleEdit = useCallback(() => router.push(`/admin/users/${userId}/edit`), [router, userId]);
  const handleToggleStatus = useCallback(() => setConfirmDialog({ open: true, type: 'toggle' }), []);
  const handleDelete = useCallback(() => setConfirmDialog({ open: true, type: 'delete' }), []);

  const handleConfirmAction = useCallback(async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      if (confirmDialog.type === 'delete' || user.status === 'active') {
        await deactivateUser(user.id);
        toast.success(`${getUserDisplayName(user)} has been deactivated.`);
      } else {
        await apiReactivateUser(user.id);
        toast.success(`${getUserDisplayName(user)} has been reactivated.`);
      }
      await fetchUser();
    } catch (e) {
      const message = e instanceof AdminApiError ? e.message : 'Something went wrong. Please try again.';
      toast.error(message);
    } finally {
      setActionLoading(false);
      setConfirmDialog({ open: false, type: 'delete' });
    }
  }, [user, confirmDialog.type, fetchUser]);

  const closeDialog = useCallback(() => setConfirmDialog({ open: false, type: 'delete' }), []);

  const getDialogProps = useCallback(() => {
    if (!user) return { title: '', message: '' };
    const name = getUserDisplayName(user);
    if (confirmDialog.type === 'delete') {
      return {
        title: 'Deactivate User',
        message: `Deactivate "${name}"? They will immediately lose access to the platform. This can be reversed later.`,
        confirmLabel: 'Deactivate',
        variant: 'danger' as const,
      };
    }
    const willActivate = user.status !== 'active';
    return {
      title: willActivate ? 'Activate User' : 'Deactivate User',
      message: willActivate
        ? `Activate "${name}"? They will be able to access the platform again.`
        : `Deactivate "${name}"? They will lose access to the platform until reactivated.`,
      confirmLabel: willActivate ? 'Activate' : 'Deactivate',
      variant: (willActivate ? 'info' : 'warning') as 'info' | 'warning',
    };
  }, [user, confirmDialog.type]);

  return {
    userId,
    user,
    permissions,
    isLoading,
    loadError,
    currentUserId,
    confirmDialog,
    actionLoading,
    handleBack,
    handleEdit,
    handleToggleStatus,
    handleDelete,
    handleConfirmAction,
    closeDialog,
    getDialogProps,
  };
}
