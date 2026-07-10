'use client';

import { useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useSetPageMetadata } from '@/context/PageContext';
import { UserForm } from '@/components/admin/users';
import type { UserFormSubmitValues } from '@/components/admin/users/UserForm';
import { createUser, AdminApiError, MANAGED_USER_TYPES } from '@/lib/api/adminUsers';
import type { UserType } from '@/data/admin/users';

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
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);

  const rawType = searchParams.get('type');
  const defaultUserType = (MANAGED_USER_TYPES as readonly string[]).includes(rawType ?? '')
    ? (rawType as UserType)
    : undefined;

  const handleSubmit = useCallback(
    async (data: UserFormSubmitValues) => {
      setSaving(true);
      try {
        const profileEntries = Object.entries(data.profileData).filter(([, v]) => v.trim() !== '');
        const created = await createUser({
          email: data.core.email,
          password: data.core.password,
          fullName: data.core.fullName,
          username: data.core.username,
          phoneNumber: data.core.phoneNumber,
          userType: data.core.userType,
          profileData: profileEntries.length > 0 ? Object.fromEntries(profileEntries) : undefined,
        });
        toast.success('User created successfully.');
        router.push(`/admin/users/${created.userId}`);
      } catch (e) {
        toast.error(e instanceof AdminApiError ? e.message : 'Failed to create user.');
      } finally {
        setSaving(false);
      }
    },
    [router],
  );

  const handleCancel = useCallback(() => {
    router.push('/admin/users');
  }, [router]);

  return (
    <UserForm
      mode="create"
      defaultUserType={defaultUserType}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={saving}
    />
  );
}
