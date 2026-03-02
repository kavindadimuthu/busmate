'use client';

import React from 'react';
import { Plus, Upload, Download } from 'lucide-react';
import { ActionButton, ActionButtonsContainer } from '@/components/shared/ActionButton';

interface BusActionButtonsProps {
  onAddBus: () => void;
  onImportBuses: () => void;
  onExportAll: () => void;
  onBulkOperations?: () => void;
  isLoading?: boolean;
  selectedCount?: number;
}

export function BusActionButtons({
  onAddBus,
  onImportBuses,
  onExportAll,
  isLoading = false,
}: BusActionButtonsProps) {
  return (
    <ActionButtonsContainer
      overflowItems={[
        { icon: <Upload className="h-3.5 w-3.5" />, label: 'Import Buses', onClick: onImportBuses, disabled: isLoading },
        { icon: <Download className="h-3.5 w-3.5" />, label: 'Export All', onClick: onExportAll, disabled: isLoading },
      ]}
    >
      <ActionButton
        icon={<Plus className="h-4 w-4" />}
        label="Add Bus"
        variant="primary"
        onClick={onAddBus}
        disabled={isLoading}
      />
      <ActionButton
        icon={<Upload className="h-4 w-4" />}
        label="Import"
        variant="secondary"
        onClick={onImportBuses}
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
