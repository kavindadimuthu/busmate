import React, { useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { getPolicyById } from '@/data/mot/policies';

export function usePolicyDetails() {
    const router = useRouter();
    const params = useParams();
    const policyId = params.policyId as string;

    const policy = getPolicyById(policyId);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleEdit = useCallback(() => {
        router.push(`/mot/policies/${policyId}/edit`);
    }, [router, policyId]);

    const handleDelete = useCallback(() => setShowDeleteModal(true), []);

    const handleDeleteConfirm = useCallback(async () => {
        try {
            setIsDeleting(true);
            // TODO: Replace with API call when backend is ready
            await new Promise((resolve) => setTimeout(resolve, 1000));
            router.push('/mot/policies');
        } catch {
            alert('Failed to delete policy. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    }, [router]);

    const handleBack = useCallback(() => router.back(), [router]);

    useSetPageMetadata({
        title: policy?.title || 'Policy Details',
        description: 'Detailed view of policy document',
        activeItem: 'policies',
        showBreadcrumbs: true,
        breadcrumbs: [{ label: 'Policies', href: '/mot/policies' }, { label: policy?.title || 'Policy Details' }],
    });

    useSetPageActions(
        policy
            ? React.createElement('div', { className: 'flex items-center gap-3 flex-wrap' },
                React.createElement('button', {
                    onClick: handleBack,
                    className: 'flex items-center gap-2 px-4 py-2 text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors',
                }, React.createElement(ArrowLeft, { className: 'w-4 h-4' }), 'Back'),
                React.createElement('button', {
                    onClick: handleEdit,
                    className: 'flex items-center gap-2 px-4 py-2 text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors',
                }, React.createElement(Edit, { className: 'w-4 h-4' }), 'Edit Policy'),
                React.createElement('button', {
                    onClick: handleDelete,
                    className: 'flex items-center gap-2 px-4 py-2 text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/10 transition-colors',
                }, React.createElement(Trash2, { className: 'w-4 h-4' }), 'Delete'),
              )
            : null
    );

    return {
        policy, router,
        showDeleteModal, setShowDeleteModal, isDeleting, handleDeleteConfirm,
    };
}
