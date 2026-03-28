import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSetPageMetadata } from '@/context/PageContext';
import { PolicyFormData } from '@/components/mot/policies/PolicyForm';

export function useUploadPolicy() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback(
        async (data: PolicyFormData) => {
            try {
                setIsSubmitting(true);
                setError(null);
                // TODO: Replace with API call when backend is ready
                await new Promise((resolve) => setTimeout(resolve, 1000));
                const newId = `POL${String(Date.now()).slice(-5)}`;
                alert('Policy created successfully!');
                router.push(`/mot/policies/${newId}`);
            } catch (err) {
                setError('Failed to create policy. Please try again.');
            } finally {
                setIsSubmitting(false);
            }
        },
        [router]
    );

    const handleCancel = useCallback(() => {
        if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
            router.push('/mot/policies');
        }
    }, [router]);

    const clearError = useCallback(() => setError(null), []);

    useSetPageMetadata({
        title: 'Upload New Policy',
        description: 'Create and publish a new policy document',
        activeItem: 'policies',
        showBreadcrumbs: true,
        breadcrumbs: [{ label: 'Policies', href: '/mot/policies' }, { label: 'Upload' }],
    });

    return { isSubmitting, error, handleSubmit, handleCancel, clearError };
}
