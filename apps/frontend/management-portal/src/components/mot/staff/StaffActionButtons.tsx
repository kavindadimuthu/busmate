'use client';

import { Plus, Download } from 'lucide-react';
import { Button } from '@busmate/ui';

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
        <div className="flex items-center gap-2">
            <Button onClick={onAddStaff} disabled={isLoading}>
                <Plus className="h-4 w-4" />
                Add Staff Member
            </Button>
            <Button variant="outline" onClick={onExportAll} disabled={isLoading}>
                <Download className="h-4 w-4" />
                Export All
            </Button>
        </div>
    );
}
