'use client';

import React from 'react';
import { Plus, Upload, Download } from 'lucide-react';
import { ActionButton, ActionButtonsContainer } from '@/components/shared/ActionButton';

// ── Types ─────────────────────────────────────────────────────────

interface PermitActionButtonsProps {
  onAddPermit: () => void;
  onImportPermits: () => void;
  onExportAll: () => void;
  isLoading?: boolean;
}

// ── Component ─────────────────────────────────────────────────────

export function PermitActionButtons({
  onAddPermit,
  onImportPermits,
  onExportAll,
  isLoading = false,
}: PermitActionButtonsProps) {
  return (
    <ActionButtonsContainer
      overflowItems={[
        {
          icon: <Upload className="h-3.5 w-3.5" />,
          label: 'Import',
          onClick: onImportPermits,
          disabled: isLoading,
        },
        {
          icon: <Download className="h-3.5 w-3.5" />,
          label: 'Export All',
          onClick: onExportAll,
          disabled: isLoading,
        },
      ]}
    >
      <ActionButton
        icon={<Plus className="h-4 w-4" />}
        label="Add Permit"
        variant="primary"
        onClick={onAddPermit}
        disabled={isLoading}
      />
      <ActionButton
        icon={<Upload className="h-4 w-4" />}
        label="Import"
        variant="ghost"
        onClick={onImportPermits}
        disabled={isLoading}
        className="hidden sm:inline-flex"
      />
      <ActionButton
        icon={<Download className="h-4 w-4" />}
        label="Export All"
        variant="secondary"
        onClick={onExportAll}
        disabled={isLoading}
        className="hidden sm:inline-flex"
      />
    </ActionButtonsContainer>
  );
}
