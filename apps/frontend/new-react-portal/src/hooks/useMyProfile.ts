'use client';

// Self-service profile data — shared by every role dashboard's "My Profile" page
// (admin, mot, operator, timekeeper). The backend grants every user type
// profile:read:own/profile:update:own, so the exact same calls used for admin's
// user-management CRUD (see lib/api/adminUsers.ts) work identically here, just
// scoped to the caller's own userId instead of an admin acting on someone else's.
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from '@/lib/router';
import { toast } from 'sonner';
import {
  AdminApiError,
  getUser,
  getUserPermissions,
  updateUser,
  updateUserProfile,
} from '@/lib/api/adminUsers';
import type { UpdateUserRequest, UserPermissionsResponse, UserResponse } from '@/lib/api/adminUsers';
import { changePassword as apiChangePassword } from '@/lib/api/selfProfile';
import { useCurrentUserId } from './useCurrentUserId';

export function useMyProfile() {
  const userId = useCurrentUserId();
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [permissions, setPermissions] = useState<UserPermissionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const [userRes, permsRes] = await Promise.all([
        getUser(userId),
        getUserPermissions(userId).catch(() => null),
      ]);
      setUser(userRes);
      setPermissions(permsRes);
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : 'Failed to load your profile.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const saveProfile = useCallback(
    async (core: UpdateUserRequest, profilePatch?: Record<string, string>): Promise<boolean> => {
      if (!userId) return false;
      setSaving(true);
      try {
        let updated = await updateUser(userId, core);
        if (profilePatch && Object.keys(profilePatch).length > 0) {
          const profileData = await updateUserProfile(userId, profilePatch);
          updated = { ...updated, profileData };
        }
        setUser(updated);
        toast.success('Profile updated successfully.');
        return true;
      } catch (e) {
        toast.error(e instanceof AdminApiError ? e.message : 'Failed to update profile.');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [userId],
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<boolean> => {
      setSaving(true);
      try {
        await apiChangePassword({ currentPassword, newPassword });
        toast.success('Password changed. Please sign in again.');
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
        return true;
      } catch (e) {
        toast.error(e instanceof AdminApiError ? e.message : 'Failed to change password.');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [router],
  );

  return { userId, user, permissions, loading, error, saving, saveProfile, changePassword, refresh: load };
}
