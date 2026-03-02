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
            <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Delete Policy</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5">
                    <p className="text-gray-600 mb-4">
                        Are you sure you want to delete the following policy? This action cannot be undone.
                    </p>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="font-medium text-gray-900">{policy.title}</p>
                        <p className="text-sm text-gray-500 mt-1">
                            {policy.id} · {policy.version} · {policy.status}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
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
