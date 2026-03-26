'use client';

import { AlertCircle } from 'lucide-react';
import { PolicySummary } from '@/components/mot/policies/PolicySummary';
import { PolicyTabsSection } from '@/components/mot/policies/PolicyTabsSection';
import { DeletePolicyModal } from '@/components/mot/policies/DeletePolicyModal';
import { usePolicyDetails } from '@/components/mot/policies/usePolicyDetails';

export default function PolicyDetailsPage() {
    const {
        policy, router,
        showDeleteModal, setShowDeleteModal, isDeleting, handleDeleteConfirm,
    } = usePolicyDetails();

    if (!policy) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-destructive/70 mx-auto mb-4" />
                <div className="text-destructive text-lg mb-4">Policy not found</div>
                <button onClick={() => router.push('/mot/policies')} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary">
                    Back to Policies
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PolicySummary policy={policy} />
            <PolicyTabsSection policy={policy} />
            <DeletePolicyModal
                isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteConfirm} policy={policy} isDeleting={isDeleting}
            />
        </div>
    );
}
