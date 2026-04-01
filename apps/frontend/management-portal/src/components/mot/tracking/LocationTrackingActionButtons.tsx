'use client';

import React from 'react';
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@busmate/ui';
import {
  RefreshCw,
  Maximize2,
  Minimize2,
  Radio,
  Settings,
  Download,
  MoreHorizontal,
} from 'lucide-react';

interface LocationTrackingActionButtonsProps {
  /** Auto-refresh enabled state */
  autoRefresh: boolean;
  /** Toggle auto-refresh */
  onAutoRefreshToggle: () => void;
  /** Manual refresh handler */
  onRefresh: () => void;
  /** Loading state */
  isLoading?: boolean;
  /** View mode */
  viewMode: 'standard' | 'fullscreen' | 'split';
  /** Toggle fullscreen/view mode */
  onViewModeChange: (mode: 'standard' | 'fullscreen' | 'split') => void;
  /** Last update timestamp */
  lastUpdate?: Date | null;
  /** Additional settings handler */
  onSettings?: () => void;
  /** Export handler */
  onExport?: () => void;
}

/**
 * Location tracking page action buttons.
 */
export function LocationTrackingActionButtons({
  autoRefresh,
  onAutoRefreshToggle,
  onRefresh,
  isLoading = false,
  viewMode,
  onViewModeChange,
  lastUpdate,
  onSettings,
  onExport,
}: LocationTrackingActionButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Last Update Indicator (text only, not a button) */}
      {lastUpdate && (
        <div className="flex items-center px-3 py-2 text-xs text-muted-foreground">
          Updated{' '}
          {lastUpdate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </div>
      )}

      {/* Live/Paused Toggle */}
      <Button
        variant={autoRefresh ? 'success' : 'outline'}
        onClick={onAutoRefreshToggle}
        disabled={isLoading}
      >
        <Radio className={`h-4 w-4 ${autoRefresh ? 'animate-pulse' : ''}`} />
        {autoRefresh ? 'Live' : 'Paused'}
      </Button>

      {/* Refresh Button */}
      <Button onClick={onRefresh} disabled={isLoading}>
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        Refresh
      </Button>

      {/* Fullscreen Toggle */}
      <Button
        variant="outline"
        onClick={() =>
          onViewModeChange(viewMode === 'fullscreen' ? 'standard' : 'fullscreen')
        }
        disabled={isLoading}
      >
        {viewMode === 'fullscreen' ? (
          <Minimize2 className="h-4 w-4" />
        ) : (
          <Maximize2 className="h-4 w-4" />
        )}
        {viewMode === 'fullscreen' ? 'Exit Fullscreen' : 'Fullscreen'}
      </Button>

      {/* Overflow Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={onSettings || (() => console.log('Settings clicked'))}
            disabled={isLoading}
          >
            <Settings className="h-3.5 w-3.5" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onExport || (() => console.log('Export clicked'))}
            disabled={isLoading}
          >
            <Download className="h-3.5 w-3.5" />
            Export Data
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
