import { useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSetPageMetadata } from '@/context/PageContext';
import { PolicyFormData } from '@/components/mot/policies/PolicyForm';
import { getPolicyById } from '@/data/mot/policies';

export function useEditPolicy() {
  const router = useRouter();
  const params = useParams();
  const policyId = params.policyId as string;

  const policy = getPolicyById(policyId);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const handleSubmit = useCallback(
    async (data: PolicyFormData) => {
      try {
        setIsSubmitting(true);
        setError(null);

        // TODO: Replace with API call when backend is ready
        await new Promise((resolve) => setTimeout(resolve, 1000));

        router.push(`/mot/policies/${policyId}`);
      } catch (err) {
        setError('Failed to update policy. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [router, policyId]
  );

  const handleCancel = useCallback(() => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      router.push(`/mot/policies/${policyId}`);
    }
  }, [router, policyId]);

  useSetPageMetadata({
    title: `Edit: ${policy?.title || 'Policy'}`,
    description: 'Update policy document details',
    activeItem: 'policies',
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Policies', href: '/mot/policies' },
      { label: policy?.title || 'Policy', href: `/mot/policies/${policyId}` },
      { label: 'Edit' },
    ],
  });

  const goBack = useCallback(() => router.back(), [router]);
  const goToPolicies = useCallback(() => router.push('/mot/policies'), [router]);

  return {
    policy,
    policyId,
    isSubmitting,
    error,
    clearError,
    handleSubmit,
    handleCancel,
    goBack,
    goToPolicies,
  };
}
