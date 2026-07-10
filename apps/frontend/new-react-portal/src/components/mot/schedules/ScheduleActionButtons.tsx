'use client';

import { Plus, Upload, Download, LayoutGrid, MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@busmate/ui';

interface ScheduleActionButtonsProps {
  onAddSchedule: () => void;
  onImportSchedules?: () => void;
  onExportAll?: () => void;
  isLoading?: boolean;
}

/**
 * Schedule page action buttons.
 */
export function ScheduleActionButtons({
  onAddSchedule,
  onImportSchedules,
  onExportAll,
  isLoading = false,
}: ScheduleActionButtonsProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <Button onClick={onAddSchedule} disabled={isLoading}>
        <Plus className="h-4 w-4" />
        Add Schedule
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push('/mot/schedules/workspace')} disabled={isLoading}>
            <LayoutGrid className="h-3.5 w-3.5" />
            Open Workspace
          </DropdownMenuItem>
          {onImportSchedules && (
            <DropdownMenuItem onClick={onImportSchedules} disabled={isLoading}>
              <Upload className="h-3.5 w-3.5" />
              Import Schedules
            </DropdownMenuItem>
          )}
          {onExportAll && (
            <DropdownMenuItem onClick={onExportAll} disabled={isLoading}>
              <Download className="h-3.5 w-3.5" />
              Export All
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
