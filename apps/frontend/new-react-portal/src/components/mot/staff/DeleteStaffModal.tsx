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
            <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-destructive/15 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Delete Staff Member</h3>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground/70 hover:text-muted-foreground transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                    <p className="text-muted-foreground text-sm">
                        Are you sure you want to delete{' '}
                        <span className="font-semibold text-foreground">{staff.fullName}</span>?
                        This action cannot be undone.
                    </p>
                    <div className="mt-4 bg-muted rounded-lg p-3 border border-border">
                        <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">ID:</span>
                                <span className="font-medium text-foreground/80">{staff.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Type:</span>
                                <span className="font-medium text-foreground/80 capitalize">{staff.staffType}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Location:</span>
                                <span className="font-medium text-foreground/80">{staff.assignedLocation}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted">
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="px-4 py-2 border border-border text-foreground/80 rounded-lg hover:bg-card font-medium text-sm transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex items-center gap-2 px-4 py-2 bg-destructive text-white rounded-lg hover:bg-destructive font-medium text-sm transition-colors disabled:opacity-50"
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
