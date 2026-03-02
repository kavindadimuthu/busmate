'use client';

import { Plus, Download } from 'lucide-react';
import { ActionButton, ActionButtonsContainer } from '@/components/shared/ActionButton';

interface StaffActionButtonsProps {
    onAddStaff: () => void;
    onExportAll: () => void;
    isLoading?: boolean;
}

export function StaffActionButtons({
    onAddStaff,
    onExportAll,
    isLoading = false,
}: StaffActionButtonsProps) {
    return (
        <ActionButtonsContainer>
            <ActionButton
                icon={<Plus className="h-4 w-4" />}
                label="Add Staff Member"
                variant="primary"
                onClick={onAddStaff}
                disabled={isLoading}
            />
            <ActionButton
                icon={<Download className="h-4 w-4" />}
                label="Export All"
                variant="secondary"
                onClick={onExportAll}
                disabled={isLoading}
            />
        </ActionButtonsContainer>
    );
}
