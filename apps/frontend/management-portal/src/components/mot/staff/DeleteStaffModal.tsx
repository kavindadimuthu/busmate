'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { StaffMember } from '@/data/mot/staff';

interface DeleteStaffModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    staff: StaffMember | null;
    isDeleting: boolean;
}

export default function DeleteStaffModal({
    isOpen,
    onClose,
    onConfirm,
    staff,
    isDeleting,
}: DeleteStaffModalProps) {
    if (!isOpen || !staff) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Delete Staff Member</h3>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                    <p className="text-gray-600 text-sm">
                        Are you sure you want to delete{' '}
                        <span className="font-semibold text-gray-900">{staff.fullName}</span>?
                        This action cannot be undone.
                    </p>
                    <div className="mt-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                                <span className="text-gray-500">ID:</span>
                                <span className="font-medium text-gray-700">{staff.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Type:</span>
                                <span className="font-medium text-gray-700 capitalize">{staff.staffType}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Location:</span>
                                <span className="font-medium text-gray-700">{staff.assignedLocation}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white font-medium text-sm transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition-colors disabled:opacity-50"
                    >
                        {isDeleting ? (
                            <>
                                <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                                Deleting...
                            </>
                        ) : (
                            'Delete Staff Member'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
