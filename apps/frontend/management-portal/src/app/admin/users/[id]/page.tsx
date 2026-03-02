'use client';

import { useMemo, useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSetPageMetadata } from '@/context/PageContext';
import { UserDetailPanel, ConfirmDialog } from '@/components/admin/users';
import {
  getUserById,
  getUserDisplayName,
  updateUserStatus,
  deleteUserById,
} from '@/data/admin/users';
import type { SystemUser } from '@/data/admin/users';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const user = useMemo(() => getUserById(userId), [userId]);

  useSetPageMetadata({
    title: user ? getUserDisplayName(user) : 'User Not Found',
    description: user ? `${user.email} — ${user.userType}` : '',
    activeItem: 'users',
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'User Management', href: '/admin/users' },
      { label: user ? getUserDisplayName(user) : userId },
    ],
  });

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'delete' | 'toggle';
  }>({ open: false, type: 'delete' });
  const [actionLoading, setActionLoading] = useState(false);

  const handleBack = useCallback(() => {
    router.push('/admin/users');
  }, [router]);

  const handleEdit = useCallback(() => {
    router.push(`/admin/users/${userId}/edit`);
  }, [router, userId]);

  const handleToggleStatus = useCallback(() => {
    setConfirmDialog({ open: true, type: 'toggle' });
  }, []);

  const handleDelete = useCallback(() => {
    setConfirmDialog({ open: true, type: 'delete' });
  }, []);

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

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
          <AlertTriangle className="h-8 w-8 text-amber-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">User Not Found</h2>
        <p className="text-sm text-gray-500 mb-6">
          No user found with ID &quot;{userId}&quot;.
        </p>
        <Link
          href="/admin/users"
          className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>
      </div>
    );
  }

  const getDialogProps = () => {
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
  };

  return (
    <div>
      <UserDetailPanel
        user={user}
        onBack={handleBack}
        onEdit={handleEdit}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDelete}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, type: 'delete' })}
        onConfirm={handleConfirmAction}
        loading={actionLoading}
        {...getDialogProps()}
      />
    </div>
  );
}
