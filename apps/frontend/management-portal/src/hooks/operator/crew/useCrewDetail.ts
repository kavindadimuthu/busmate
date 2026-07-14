'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getUser, deactivateUser, reactivateUser, AdminApiError } from '@/lib/api/adminUsers';
import { toAdminUser, getUserDisplayName } from '@/data/admin/users';
import type { AdminUser } from '@/data/admin/users';

export function useCrewDetail() {
  const params = useParams();
  const router = useRouter();
  const conductorId = params.conductorId as string;

  const [conductor, setConductor] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loadConductor = useCallback(async () => {
    if (!conductorId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await getUser(conductorId);
      setConductor(toAdminUser(response));
    } catch (err) {
      console.error('Error loading conductor:', err);
      setError(err instanceof AdminApiError ? err.message : 'Failed to load crew member.');
      setConductor(null);
    } finally {
      setIsLoading(false);
    }
  }, [conductorId]);

  useEffect(() => {
    loadConductor();
  }, [loadConductor]);

  const handleEdit = useCallback(() => {
    router.push(`/operator/crew/${conductorId}/edit`);
  }, [router, conductorId]);

  const handleBack = useCallback(() => router.push('/operator/crew'), [router]);

  const openConfirm = useCallback(() => setConfirmOpen(true), []);
  const closeConfirm = useCallback(() => setConfirmOpen(false), []);

  const handleConfirmToggleStatus = useCallback(async () => {
    if (!conductor) return;
    setActionLoading(true);
    try {
      if (conductor.status === 'active') {
        await deactivateUser(conductor.id);
        toast.success(`${getUserDisplayName(conductor)} has been deactivated.`);
      } else {
        await reactivateUser(conductor.id);
        toast.success(`${getUserDisplayName(conductor)} has been reactivated.`);
      }
      await loadConductor();
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setActionLoading(false);
      setConfirmOpen(false);
    }
  }, [conductor, loadConductor]);

  return {
    conductor,
    isLoading,
    error,
    actionLoading,
    confirmOpen,
    handleEdit,
    handleBack,
    openConfirm,
    closeConfirm,
    handleConfirmToggleStatus,
    reload: loadConductor,
  };
}
