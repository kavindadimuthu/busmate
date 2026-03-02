'use client';

import { Download } from 'lucide-react';
import { ActionButton, ActionButtonsContainer } from '@/components/shared/ActionButton';

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
    <ActionButtonsContainer>
      <ActionButton
        icon={<Download className="h-4 w-4" />}
        label="Export"
        variant="secondary"
        onClick={onExportAll}
        disabled={isLoading}
      />
    </ActionButtonsContainer>
  );
}
