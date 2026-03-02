'use client';

import React from 'react';
import { Plus, Upload, Download } from 'lucide-react';
import { ActionButton, ActionButtonsContainer } from '@/components/shared/ActionButton';

// ── Types ─────────────────────────────────────────────────────────

interface OperatorActionButtonsProps {
  onAddOperator: () => void;
  onImportOperators: () => void;
  onExportAll: () => void;
  isLoading?: boolean;
}

// ── Component ─────────────────────────────────────────────────────

export function OperatorActionButtons({
  onAddOperator,
  onImportOperators,
  onExportAll,
  isLoading = false,
}: OperatorActionButtonsProps) {
  return (
    <ActionButtonsContainer
      overflowItems={[
        {
          icon: <Upload className="h-3.5 w-3.5" />,
          label: 'Import',
          onClick: onImportOperators,
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
        label="Add Operator"
        variant="primary"
        onClick={onAddOperator}
        disabled={isLoading}
      />
      <ActionButton
        icon={<Upload className="h-4 w-4" />}
        label="Import"
        variant="ghost"
        onClick={onImportOperators}
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
