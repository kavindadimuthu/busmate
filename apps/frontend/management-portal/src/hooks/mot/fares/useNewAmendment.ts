import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSetPageMetadata } from '@/context/PageContext';
import { FareAmendmentFormData } from '@/data/mot/fares';

export function useNewAmendment() {
  const router = useRouter();

  useSetPageMetadata({
    title: 'New Fare Amendment',
    description: 'Create a new fare structure amendment',
    activeItem: 'fares',
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Fares', href: '/mot/fares' },
      { label: 'New Amendment' },
    ],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const handleSubmit = useCallback(
    async (data: FareAmendmentFormData) => {
      try {
        setIsSubmitting(true);
        setError(null);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const newId = `FA-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;
        alert(`Fare amendment created successfully! ID: ${newId}`);
        router.push('/mot/fares');
      } catch {
        setError('Failed to create fare amendment. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [router]
  );

  const handleCancel = useCallback(() => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      router.push('/mot/fares');
    }
  }, [router]);

  return { isSubmitting, error, clearError, handleSubmit, handleCancel };
}
