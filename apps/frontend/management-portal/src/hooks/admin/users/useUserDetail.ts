'use client';

import { useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getUserById,
  getUserDisplayName,
  updateUserStatus,
  deleteUserById,
} from '@/data/admin/users';

export function useUserDetail() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const user = useMemo(() => getUserById(userId), [userId]);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'delete' | 'toggle';
  }>({ open: false, type: 'delete' });
  const [actionLoading, setActionLoading] = useState(false);

  const handleBack = useCallback(() => router.push('/admin/users'), [router]);
  const handleEdit = useCallback(
    () => router.push(`/admin/users/${userId}/edit`),
    [router, userId]
  );
  const handleToggleStatus = useCallback(
    () => setConfirmDialog({ open: true, type: 'toggle' }),
    []
  );
  const handleDelete = useCallback(
    () => setConfirmDialog({ open: true, type: 'delete' }),
    []
  );

  const handleConfirmAction = useCallback(async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      if (confirmDialog.type === 'delete') {
        await deleteUserById(user.id);
        router.push('/admin/users');
      } else {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        await updateUserStatus(user.id, newStatus);
        router.refresh();
      }
    } finally {
      setActionLoading(false);
      setConfirmDialog({ open: false, type: 'delete' });
    }
  }, [user, confirmDialog.type, router]);

  const closeDialog = useCallback(
    () => setConfirmDialog({ open: false, type: 'delete' }),
    []
  );

  const getDialogProps = useCallback(() => {
    if (!user) return { title: '', message: '' };
    const name = getUserDisplayName(user);
    if (confirmDialog.type === 'delete') {
      return {
        title: 'Delete User',
        message: `Are you sure you want to permanently delete "${name}" (${user.id})? This action cannot be undone.`,
        confirmLabel: 'Delete',
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
