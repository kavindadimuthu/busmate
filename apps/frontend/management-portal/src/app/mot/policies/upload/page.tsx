'use client';

import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { useSetPageMetadata } from '@/context/PageContext';
import { PolicyForm, PolicyFormData } from '@/components/mot/policies/PolicyForm';

export default function UploadPolicyPage() {
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

                // Generate a temporary ID (will come from backend response in production)
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

    useSetPageMetadata({
        title: 'Upload New Policy',
        description: 'Create and publish a new policy document',
        activeItem: 'policies',
        showBreadcrumbs: true,
        breadcrumbs: [{ label: 'Policies', href: '/mot/policies' }, { label: 'Upload' }],
    });

    return (
            <div className="space-y-6">
                {/* Error Alert */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start">
                            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3 shrink-0" />
                            <div className="flex-1">
                                <h3 className="text-sm font-medium text-red-800">Error Creating Policy</h3>
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

                {/* Form */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Policy Information</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Enter the new policy details
                        </p>
                    </div>
                    <div className="p-6">
                        <PolicyForm
                            onSubmit={handleSubmit}
                            onCancel={handleCancel}
                            isSubmitting={isSubmitting}
                            submitButtonText="Create Policy"
                            mode="create"
                        />
                    </div>
                </div>

                {/* Helper Information */}
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Guidelines</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">Required Fields</h4>
                            <ul className="space-y-1">
                                <li>• Policy title must be descriptive and unique</li>
                                <li>• Policy type must be selected</li>
                                <li>• A brief description is required</li>
                                <li>• Author and department must be specified</li>
                                <li>• Effective date must be set</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">Best Practices</h4>
                            <ul className="space-y-1">
                                <li>• Use markdown formatting for policy content</li>
                                <li>• Add relevant tags for discoverability</li>
                                <li>• Set appropriate priority level</li>
                                <li>• Attach supporting documents via URL</li>
                                <li>• Save as draft first, then publish after review</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
    );
}
