'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSetPageMetadata } from '@/context/PageContext';
import { UserForm } from '@/components/admin/users';
import { createUser } from '@/data/admin/users';
import type { SystemUser } from '@/data/admin/users';

export default function CreateUserPage() {
  useSetPageMetadata({
    title: 'Create User',
    description: 'Add a new user to the platform',
    activeItem: 'users',
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'User Management', href: '/admin/users' },
      { label: 'Create User' },
    ],
  });

  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleSubmit = useCallback(
    async (data: Partial<SystemUser>) => {
      setSaving(true);
      try {
        const newUser = await createUser(data);
        router.push(`/admin/users/${newUser.id}`);
      } finally {
        setSaving(false);
      }
    },
    [router]
  );

  const handleCancel = useCallback(() => {
    router.push('/admin/users');
  }, [router]);

  return (
    <UserForm
      mode="create"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={saving}
    />
  );
}
