'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSetPageMetadata } from '@/context/PageContext';
import { UserForm } from '@/components/admin/users';
import type { UserFormSubmitValues } from '@/components/admin/users/UserForm';
import { getUserDisplayName, toAdminUser } from '@/data/admin/users';
import type { AdminUser } from '@/data/admin/users';
import { getUser, updateUser, updateUserProfile, AdminApiError } from '@/lib/api/adminUsers';
import { ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getUser(userId)
      .then((response) => {
        if (!cancelled) setUser(toAdminUser(response));
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e instanceof AdminApiError ? e.message : 'Failed to load user.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

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

  const handleSubmit = useCallback(
    async (data: UserFormSubmitValues) => {
      setSaving(true);
      try {
        await updateUser(userId, {
          fullName: data.core.fullName,
          username: data.core.username,
          phoneNumber: data.core.phoneNumber,
        });
        const profileEntries = Object.entries(data.profileData).filter(([, v]) => v.trim() !== '');
        if (profileEntries.length > 0) {
          await updateUserProfile(userId, Object.fromEntries(profileEntries));
        }
        toast.success('User updated successfully.');
        router.push(`/admin/users/${userId}`);
      } catch (e) {
        toast.error(e instanceof AdminApiError ? e.message : 'Failed to update user.');
      } finally {
        setSaving(false);
      }
    },
    [userId, router],
  );

  const handleCancel = useCallback(() => {
    router.push(`/admin/users/${userId}`);
  }, [router, userId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">Loading user…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-warning/15 flex items-center justify-center mb-4">
          <AlertTriangle className="h-8 w-8 text-warning" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">{loadError ?? 'User Not Found'}</h2>
        {!loadError && (
          <p className="text-sm text-muted-foreground mb-6">
            No user found with ID &quot;{userId}&quot;.
          </p>
        )}
        <Link
          href="/admin/users"
          className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary mt-2"
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
