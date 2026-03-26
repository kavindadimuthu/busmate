'use client';

import { AlertCircle, ArrowLeft } from 'lucide-react';
import { PolicyForm } from '@/components/mot/policies/PolicyForm';
import { useEditPolicy } from '@/components/mot/policies/useEditPolicy';

export default function EditPolicyPage() {
    const {
        policy, policyId, isSubmitting, error, clearError,
        handleSubmit, handleCancel, goBack, goToPolicies,
    } = useEditPolicy();

    if (!policy) {
        return (
            <div className="max-w-md mx-auto text-center py-12">
                <AlertCircle className="w-16 h-16 text-destructive/80 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">Policy Not Found</h2>
                <p className="text-muted-foreground mb-6">
                    The policy you&apos;re trying to edit doesn&apos;t exist.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button onClick={goBack} className="flex items-center justify-center px-4 py-2 border border-border rounded-lg text-foreground/80 hover:bg-muted transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Go Back
                    </button>
                    <button onClick={goToPolicies} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary transition-colors">
                        View All Policies
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-destructive/70 mt-0.5 mr-3 shrink-0" />
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-destructive">Error Updating Policy</h3>
                            <p className="text-sm text-destructive mt-1">{error}</p>
                            <button onClick={clearError} className="text-sm text-destructive hover:text-destructive underline mt-2">Dismiss</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <h3 className="text-sm font-medium text-primary mb-2">Current Policy Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-primary">
                    <div><span className="font-medium">Policy ID:</span><span className="ml-2">{policy.id}</span></div>
                    <div><span className="font-medium">Version:</span><span className="ml-2">{policy.version}</span></div>
                    <div><span className="font-medium">Status:</span><span className="ml-2">{policy.status}</span></div>
                </div>
            </div>

            <div className="bg-card rounded-lg border border-border shadow-sm">
                <div className="p-6 border-b border-border">
                    <h2 className="text-lg font-semibold text-foreground">Update Policy Details</h2>
                    <p className="text-sm text-muted-foreground mt-1">Modify the policy information below</p>
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
