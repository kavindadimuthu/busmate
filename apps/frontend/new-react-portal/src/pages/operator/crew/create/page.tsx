'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { CrewForm, type CrewFormSubmitValues } from '@/components/operator/crew';
import { createUser, AdminApiError } from '@/lib/api/adminUsers';
import { useMyOperator } from '@/hooks/operator/useMyOperator';

export default function CreateConductorPage() {
  const router = useRouter();
  const { operator, isLoading: operatorLoading, error: operatorError } = useMyOperator();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useSetPageMetadata({
    title: 'Add Conductor',
    description: 'Create a new conductor account for your fleet',
    activeItem: 'crew',
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Crew Management', href: '/operator/crew' },
      { label: 'Add Conductor' },
    ],
  });

  const handleCancel = () => router.push('/operator/crew');

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
    if (!operator?.id) {
      setSubmitError('Your operator profile could not be resolved. Please refresh and try again.');
      return;
    }

    setLoading(true);
    setSubmitError(null);
    try {
      const created = await createUser({
        email: data.core.email!,
        password: data.core.password!,
        fullName: data.core.fullName,
        username: data.core.username,
        phoneNumber: data.core.phoneNumber,
        userType: 'conductor',
        profileData: {
          employee_id: data.profileData.employee_id,
          nic_number: data.profileData.nic_number,
          assign_operator_id: operator.id,
        },
      });
      toast.success(`${data.core.fullName} has been added as a conductor.`);
      router.push(`/operator/crew/${created.userId}`);
    } catch (err) {
      const message = err instanceof AdminApiError ? err.message : 'Failed to create conductor. Please try again.';
      setSubmitError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (operatorLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (operatorError || !operator) {
    return (
      <div className="max-w-md mx-auto mt-16 bg-card border border-destructive/20 rounded-xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-destructive/80 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-foreground mb-2">Could not load your operator profile</h2>
        <p className="text-sm text-muted-foreground">{operatorError ?? 'Please refresh and try again.'}</p>
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
      <CrewForm mode="create" onSubmit={handleSubmit} onCancel={handleCancel} loading={loading} />
    </div>
  );
}
