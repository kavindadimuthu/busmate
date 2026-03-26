'use client';

import { AlertCircle } from 'lucide-react';
import { PolicyForm } from '@/components/mot/policies/PolicyForm';
import { useUploadPolicy } from '@/components/mot/policies/useUploadPolicy';

export default function UploadPolicyPage() {
    const { isSubmitting, error, handleSubmit, handleCancel, clearError } = useUploadPolicy();

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-destructive/70 mt-0.5 mr-3 shrink-0" />
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-destructive">Error Creating Policy</h3>
                            <p className="text-sm text-destructive mt-1">{error}</p>
                            <button onClick={clearError} className="text-sm text-destructive hover:text-destructive underline mt-2">
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-card rounded-lg border border-border shadow-sm">
                <div className="p-6 border-b border-border">
                    <h2 className="text-lg font-semibold text-foreground">Policy Information</h2>
                    <p className="text-sm text-muted-foreground mt-1">Enter the new policy details</p>
                </div>
                <div className="p-6">
                    <PolicyForm onSubmit={handleSubmit} onCancel={handleCancel} isSubmitting={isSubmitting} submitButtonText="Create Policy" mode="create" />
                </div>
            </div>

            <div className="bg-muted rounded-lg border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Guidelines</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-muted-foreground">
                    <div>
                        <h4 className="font-medium text-foreground mb-2">Required Fields</h4>
                        <ul className="space-y-1">
                            <li>• Policy title must be descriptive and unique</li>
                            <li>• Policy type must be selected</li>
                            <li>• A brief description is required</li>
                            <li>• Author and department must be specified</li>
                            <li>• Effective date must be set</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium text-foreground mb-2">Best Practices</h4>
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
