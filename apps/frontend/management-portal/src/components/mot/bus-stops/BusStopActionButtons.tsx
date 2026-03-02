'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Upload,
  Download,
  CheckSquare,
} from 'lucide-react';
import {
  ActionButton,
  ActionButtonsContainer,
  OverflowMenu,
} from '@/components/shared/ActionButton';
import type { OverflowMenuItem } from '@/components/shared/ActionButton';

interface BusStopActionButtonsProps {
  onAddBusStop: () => void;
  onImportBusStops: () => void;
  onBulkOperations?: () => void;
  isLoading?: boolean;
  selectedCount?: number;
}

/**
 * Bus-stop page action buttons.
 *
 * Wraps the shared `<ActionButton>`, `<ActionButtonsContainer>`, and
 * `<OverflowMenu>` components with bus-stop-specific actions.
 */
export function BusStopActionButtons({
  onAddBusStop,
  onImportBusStops,
  onBulkOperations,
  isLoading = false,
  selectedCount = 0,
}: BusStopActionButtonsProps) {
  const router = useRouter();
  const handleExport = () => router.push('/mot/bus-stops/export');

  const overflowItems: OverflowMenuItem[] = [
    { icon: <Upload className="h-3.5 w-3.5" />,   label: 'Import Stops',  onClick: onImportBusStops, disabled: isLoading },
    { icon: <Download className="h-3.5 w-3.5" />, label: 'Export Stops',  onClick: handleExport,     disabled: isLoading },
    ...(selectedCount > 0 && onBulkOperations
      ? [{
          icon: <CheckSquare className="h-3.5 w-3.5" />,
          label: `Bulk Actions (${selectedCount})`,
          onClick: onBulkOperations,
          disabled: isLoading,
          variant: 'warning' as const,
        }]
      : []),
  ];

  return (
    <ActionButtonsContainer>
      {/* Bulk — sm+ only, when items are selected */}
      {selectedCount > 0 && onBulkOperations && (
        <ActionButton
          icon={<CheckSquare className="h-4 w-4" />}
          label="Bulk Actions"
          badge={selectedCount}
          variant="warning"
          onClick={onBulkOperations}
          disabled={isLoading}
          className="hidden sm:inline-flex"
        />
      )}

      {/* Export — sm+ only */}
      <ActionButton
        icon={<Download className="h-4 w-4" />}
        label="Export"
        variant="secondary"
        onClick={handleExport}
        disabled={isLoading}
        className="hidden sm:inline-flex"
      />

      {/* Import — sm+ only */}
      <ActionButton
        icon={<Upload className="h-4 w-4" />}
        label="Import"
        variant="ghost"
        onClick={onImportBusStops}
        disabled={isLoading}
        className="hidden sm:inline-flex"
      />

      {/* Add Bus Stop — always visible (primary CTA) */}
      <ActionButton
        icon={<Plus className="h-4 w-4" />}
        label="Add Bus Stop"
        variant="primary"
        onClick={onAddBusStop}
        disabled={isLoading}
      />

      {/* Overflow menu — xs screens only */}
      {/* <OverflowMenu items={overflowItems} /> */}
    </ActionButtonsContainer>
  );
}