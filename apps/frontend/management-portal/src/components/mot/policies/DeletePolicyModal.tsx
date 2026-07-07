'use client';

import { AlertTriangle, X } from 'lucide-react';
import { Policy } from '@/data/mot/policies';

interface DeletePolicyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    policy: Policy | null;
    isDeleting?: boolean;
}

export function DeletePolicyModal({
    isOpen,
    onClose,
    onConfirm,
    policy,
    isDeleting = false,
}: DeletePolicyModalProps) {
    if (!isOpen || !policy) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-card rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-destructive/15 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Delete Policy</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-muted-foreground/70 hover:text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5">
                    <p className="text-muted-foreground mb-4">
                        Are you sure you want to delete the following policy? This action cannot be undone.
                    </p>
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                        <p className="font-medium text-foreground">{policy.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            {policy.id} · {policy.version} · {policy.status}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 p-5 border-t border-border bg-muted">
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="px-4 py-2.5 text-sm font-medium text-foreground/80 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="px-4 py-2.5 text-sm font-medium text-white bg-destructive rounded-lg hover:bg-destructive transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isDeleting && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        )}
                        {isDeleting ? 'Deleting...' : 'Delete Policy'}
                    </button>
                </div>
            </div>
        </div>
    );
}
