'use client';

import { Plus, Upload, Download } from 'lucide-react';
import {
  ActionButton,
  ActionButtonsContainer,
  OverflowMenu,
} from '@/components/shared/ActionButton';
import type { OverflowMenuItem } from '@/components/shared/ActionButton';

interface RouteActionButtonsProps {
  onAddRoute: () => void;
  onExportAll: () => void;
  onImport?: () => void;
  isLoading?: boolean;
}

/**
 * Route page action buttons.
 *
 * Wraps the shared `<ActionButton>`, `<ActionButtonsContainer>`, and
 * `<OverflowMenu>` components with route-specific actions.
 */
export function RouteActionButtons({
  onAddRoute,
  onExportAll,
  onImport,
  isLoading = false,
}: RouteActionButtonsProps) {
  const overflowItems: OverflowMenuItem[] = [
    ...(onImport
      ? [{ icon: <Upload className="h-3.5 w-3.5" />, label: 'Import Routes', onClick: onImport, disabled: isLoading }]
      : []),
    { icon: <Download className="h-3.5 w-3.5" />, label: 'Export Routes', onClick: onExportAll, disabled: isLoading },
  ];

  return (
    <ActionButtonsContainer>
      <ActionButton
        variant="primary"
        icon={<Plus className="h-4 w-4" />}
        label="Add Route"
        onClick={onAddRoute}
        disabled={isLoading}
      />
      {/* <OverflowMenu items={overflowItems} /> */}
    </ActionButtonsContainer>
  );
}