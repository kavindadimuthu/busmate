'use client';

import { Plus, Upload, Download, LayoutGrid } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  ActionButton,
  ActionButtonsContainer,
  OverflowMenu,
} from '@/components/shared/ActionButton';
import type { OverflowMenuItem } from '@/components/shared/ActionButton';

interface ScheduleActionButtonsProps {
  onAddSchedule: () => void;
  onImportSchedules?: () => void;
  onExportAll?: () => void;
  isLoading?: boolean;
}

/**
 * Schedule page action buttons.
 *
 * Wraps the shared `<ActionButton>`, `<ActionButtonsContainer>`, and
 * `<OverflowMenu>` components with schedule-specific actions.
 */
export function ScheduleActionButtons({
  onAddSchedule,
  onImportSchedules,
  onExportAll,
  isLoading = false,
}: ScheduleActionButtonsProps) {
  const router = useRouter();

  const overflowItems: OverflowMenuItem[] = [
    {
      icon: <LayoutGrid className="h-3.5 w-3.5" />,
      label: 'Open Workspace',
      onClick: () => router.push('/mot/schedules/workspace'),
      disabled: isLoading,
    },
    ...(onImportSchedules
      ? [{ icon: <Upload className="h-3.5 w-3.5" />, label: 'Import Schedules', onClick: onImportSchedules, disabled: isLoading }]
      : []),
    ...(onExportAll
      ? [{ icon: <Download className="h-3.5 w-3.5" />, label: 'Export All', onClick: onExportAll, disabled: isLoading }]
      : []),
  ];

  return (
    <ActionButtonsContainer>
      <ActionButton
        variant="primary"
        icon={<Plus className="h-4 w-4" />}
        label="Add Schedule"
        onClick={onAddSchedule}
        disabled={isLoading}
      />
      <OverflowMenu items={overflowItems} />
    </ActionButtonsContainer>
  );
}
