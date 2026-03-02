'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useCallback } from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useSetPageMetadata } from '@/context/PageContext';
import { PolicyForm, PolicyFormData } from '@/components/mot/policies/PolicyForm';
import { getPolicyById } from '@/data/mot/policies';

export default function EditPolicyPage() {
    const router = useRouter();
    const params = useParams();
    const policyId = params.policyId as string;

    // Load policy from sample data (swap to API call when backend is ready)
    const policy = getPolicyById(policyId);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback(
        async (data: PolicyFormData) => {
            try {
                setIsSubmitting(true);
                setError(null);

                // TODO: Replace with API call when backend is ready
                await new Promise((resolve) => setTimeout(resolve, 1000));

                // Navigate back to policy details on success
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

    // Not found state
    if (!policy) {
        return (
            <div className="max-w-md mx-auto text-center py-12">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Policy Not Found</h2>
                <p className="text-gray-600 mb-6">
                    The policy you&apos;re trying to edit doesn&apos;t exist.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Go Back
                    </button>
                    <button
                        onClick={() => router.push('/mot/policies')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        View All Policies
                    </button>
                </div>
            </div>
        );
    }

    return (
            <div className="space-y-6">
                {/* Error Alert */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start">
                            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3 shrink-0" />
                            <div className="flex-1">
                                <h3 className="text-sm font-medium text-red-800">Error Updating Policy</h3>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                                <button
                                    onClick={() => setError(null)}
                                    className="text-sm text-red-600 hover:text-red-800 underline mt-2"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Current Policy Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-800 mb-2">Current Policy Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-700">
                        <div>
                            <span className="font-medium">Policy ID:</span>
                            <span className="ml-2">{policy.id}</span>
                        </div>
                        <div>
                            <span className="font-medium">Version:</span>
                            <span className="ml-2">{policy.version}</span>
                        </div>
                        <div>
                            <span className="font-medium">Status:</span>
                            <span className="ml-2">{policy.status}</span>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Update Policy Details</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Modify the policy information below
                        </p>
                    </div>
                    <div className="p-6">
                        <PolicyForm
                            policy={policy}
                            onSubmit={handleSubmit}
                            onCancel={handleCancel}
                            isSubmitting={isSubmitting}
                            submitButtonText="Update Policy"
                            mode="edit"
                        />
                    </div>
                </div>
            </div>
    );
}
