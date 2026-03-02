'use client';

import { useMemo, useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSetPageMetadata } from '@/context/PageContext';
import { UserForm } from '@/components/admin/users';
import {
  getUserById,
  getUserDisplayName,
  updateUser,
} from '@/data/admin/users';
import type { SystemUser } from '@/data/admin/users';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const user = useMemo(() => getUserById(userId), [userId]);

  useSetPageMetadata({
    title: user ? `Edit — ${getUserDisplayName(user)}` : 'User Not Found',
    description: 'Edit user details and account settings',
    activeItem: 'users',
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'User Management', href: '/admin/users' },
      { label: user ? getUserDisplayName(user) : userId, href: `/admin/users/${userId}` },
      { label: 'Edit' },
    ],
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = useCallback(
    async (data: Partial<SystemUser>) => {
      setSaving(true);
      try {
        await updateUser(userId, data);
        router.push(`/admin/users/${userId}`);
      } finally {
        setSaving(false);
      }
    },
    [userId, router]
  );

  const handleCancel = useCallback(() => {
    router.push(`/admin/users/${userId}`);
  }, [router, userId]);

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

  return (
    <UserForm
      mode="edit"
      user={user}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={saving}
    />
  );
}
