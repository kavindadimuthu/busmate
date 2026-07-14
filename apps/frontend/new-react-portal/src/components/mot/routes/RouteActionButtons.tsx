'use client';

import { Plus } from 'lucide-react';
import { Button } from '@busmate/ui';

interface RouteActionButtonsProps {
  onAddRoute: () => void;
  onExportAll: () => void;
  onImport?: () => void;
  isLoading?: boolean;
}

/**
 * Route page action buttons.
 */
export function RouteActionButtons({
  onAddRoute,
  isLoading = false,
}: RouteActionButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button onClick={onAddRoute} disabled={isLoading}>
        <Plus className="h-4 w-4" />
        Add Route
      </Button>
    </div>
  );
}