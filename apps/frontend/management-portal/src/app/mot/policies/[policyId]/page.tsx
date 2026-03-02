'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useCallback } from 'react';
import {
    ArrowLeft,
    Edit,
    Trash2,
    AlertCircle,
} from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { PolicySummary } from '@/components/mot/policies/PolicySummary';
import { PolicyTabsSection } from '@/components/mot/policies/PolicyTabsSection';
import { DeletePolicyModal } from '@/components/mot/policies/DeletePolicyModal';
import { getPolicyById } from '@/data/mot/policies';

export default function PolicyDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const policyId = params.policyId as string;

    // Load policy from sample data (swap to API call when backend is ready)
    const policy = getPolicyById(policyId);

    // Delete modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleEdit = useCallback(() => {
        router.push(`/mot/policies/${policyId}/edit`);
    }, [router, policyId]);

    const handleDelete = useCallback(() => {
        setShowDeleteModal(true);
    }, []);

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

    const handleBack = useCallback(() => {
        router.back();
    }, [router]);

    useSetPageMetadata({
        title: policy?.title || 'Policy Details',
        description: 'Detailed view of policy document',
        activeItem: 'policies',
        showBreadcrumbs: true,
        breadcrumbs: [{ label: 'Policies', href: '/mot/policies' }, { label: policy?.title || 'Policy Details' }],
    });

    useSetPageActions(
        policy ? (
            <div className="flex items-center gap-3 flex-wrap">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>
                <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                >
                    <Edit className="w-4 h-4" />
                    Edit Policy
                </button>
                <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                    Delete
                </button>
            </div>
        ) : null
    );

    // Not found state
    if (!policy) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <div className="text-red-600 text-lg mb-4">Policy not found</div>
                <button
                    onClick={() => router.push('/mot/policies')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    Back to Policies
                </button>
            </div>
        );
    }

    return (
            <div className="space-y-6">
                {/* Policy Summary Card */}
                <PolicySummary policy={policy} />

                {/* Tabs Section */}
                <PolicyTabsSection policy={policy} />

                {/* Delete Modal */}
                <DeletePolicyModal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={handleDeleteConfirm}
                    policy={policy}
                    isDeleting={isDeleting}
                />
            </div>
    );
}
