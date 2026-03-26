'use client';

import { useSetPageMetadata } from '@/context/PageContext';
import { UserDetailPanel, ConfirmDialog } from '@/components/admin/users';
import { getUserDisplayName } from '@/data/admin/users';
import { useUserDetail } from '@/components/admin/users/useUserDetail';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function UserDetailPage() {
  const {
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
  } = useUserDetail();

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

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-warning/15 flex items-center justify-center mb-4">
          <AlertTriangle className="h-8 w-8 text-warning" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">User Not Found</h2>
        <p className="text-sm text-muted-foreground mb-6">
          No user found with ID &quot;{userId}&quot;.
        </p>
        <Link
          href="/admin/users"
          className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>
      </div>
    );
  }

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
        onClose={closeDialog}
        onConfirm={handleConfirmAction}
        loading={actionLoading}
        {...getDialogProps()}
      />
    </div>
  );
}

