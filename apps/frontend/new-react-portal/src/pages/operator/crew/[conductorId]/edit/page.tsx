'use client';

import { useState } from 'react';
import { useRouter, useParams } from '@/lib/router';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { CrewForm, type CrewFormSubmitValues } from '@/components/operator/crew';
import { updateUser, updateUserProfile, AdminApiError } from '@/lib/api/adminUsers';
import { useCrewDetail } from '@/hooks/operator/crew/useCrewDetail';

export default function EditConductorPage() {
  const router = useRouter();
  const params = useParams();
  const conductorId = params.conductorId as string;

  const { conductor, isLoading, error } = useCrewDetail();
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useSetPageMetadata({
    title: 'Edit Conductor',
    description: 'Update conductor information',
    activeItem: 'crew',
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Crew Management', href: '/operator/crew' },
      { label: conductor?.fullName ?? 'Edit' },
    ],
  });

  const handleCancel = () => router.push(`/operator/crew/${conductorId}`);

  useSetPageActions(
    <button
      onClick={handleCancel}
      className="flex items-center gap-2 px-3 py-1.5 text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors text-sm font-medium"
    >
      <ArrowLeft className="w-4 h-4" />
      Back
    </button>,
  );

  const handleSubmit = async (data: CrewFormSubmitValues) => {
    setSaving(true);
    setSubmitError(null);
    try {
      await updateUser(conductorId, {
        fullName: data.core.fullName,
        username: data.core.username,
        phoneNumber: data.core.phoneNumber,
      });
      // Merges with the existing profile server-side — assign_operator_id (not editable
      // here) is preserved automatically. See UserProfileService.updateProfile().
      await updateUserProfile(conductorId, {
        employee_id: data.profileData.employee_id,
        nic_number: data.profileData.nic_number,
      });
      toast.success(`${data.core.fullName}'s details have been updated.`);
      router.push(`/operator/crew/${conductorId}`);
    } catch (err) {
      const message = err instanceof AdminApiError ? err.message : 'Failed to update conductor. Please try again.';
      setSubmitError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (error || !conductor) {
    return (
      <div className="max-w-md mx-auto mt-16 bg-card border border-destructive/20 rounded-xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-destructive/80 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-foreground mb-2">{error ?? 'Conductor not found'}</h2>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {submitError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive/70 mt-0.5 shrink-0" />
          <p className="text-sm text-destructive">{submitError}</p>
        </div>
      )}
      <CrewForm mode="edit" conductor={conductor} onSubmit={handleSubmit} onCancel={handleCancel} loading={saving} />
    </div>
  );
}
