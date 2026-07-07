'use client';

import { Download } from 'lucide-react';
import { Button } from '@busmate/ui';

// ── Types ─────────────────────────────────────────────────────────

interface StaffActionButtonsProps {
  onExportAll: () => void;
  isLoading?: boolean;
}

// ── Component ─────────────────────────────────────────────────────

export function StaffActionButtons({
  onExportAll,
  isLoading = false,
}: StaffActionButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={onExportAll} disabled={isLoading}>
        <Download className="h-4 w-4" />
        Export
      </Button>
    </div>
  );
}
