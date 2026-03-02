'use client';

import React from 'react';
import {
  ActionButton,
  ActionButtonsContainer,
  OverflowMenu,
  type ActionButtonVariant,
  type OverflowMenuItem,
} from '@/components/shared/ActionButton';
import {
  RefreshCw,
  Maximize2,
  Minimize2,
  Radio,
  Settings,
  Download,
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
 *
 * Wraps the shared `<ActionButton>`, `<ActionButtonsContainer>`, and
 * `<OverflowMenu>` components with location-tracking-specific actions.
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
  const overflowItems: OverflowMenuItem[] = [
    {
      icon: <Settings className="h-3.5 w-3.5" />,
      label: 'Settings',
      onClick: onSettings || (() => console.log('Settings clicked')),
      disabled: isLoading,
    },
    {
      icon: <Download className="h-3.5 w-3.5" />,
      label: 'Export Data',
      onClick: onExport || (() => console.log('Export clicked')),
      disabled: isLoading,
    },
  ];

  // Determine the variant for the live/paused button
  const liveButtonVariant: ActionButtonVariant = autoRefresh ? 'success' : 'secondary';

  return (
    <ActionButtonsContainer>
      {/* Last Update Indicator (text only, not a button) */}
      {lastUpdate && (
        <div className="flex items-center px-3 py-2 text-xs text-gray-500">
          Updated{' '}
          {lastUpdate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </div>
      )}

      {/* Live/Paused Toggle */}
      <ActionButton
        icon={<Radio className={`h-4 w-4 ${autoRefresh ? 'animate-pulse' : ''}`} />}
        label={autoRefresh ? 'Live' : 'Paused'}
        variant={liveButtonVariant}
        onClick={onAutoRefreshToggle}
        disabled={isLoading}
      />

      {/* Refresh Button */}
      <ActionButton
        icon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />}
        label="Refresh"
        variant="primary"
        onClick={onRefresh}
        disabled={isLoading}
      />

      {/* Fullscreen Toggle */}
      <ActionButton
        icon={
          viewMode === 'fullscreen' ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )
        }
        label={viewMode === 'fullscreen' ? 'Exit Fullscreen' : 'Fullscreen'}
        variant="secondary"
        onClick={() =>
          onViewModeChange(viewMode === 'fullscreen' ? 'standard' : 'fullscreen')
        }
        disabled={isLoading}
      />

      {/* Overflow Menu */}
      {overflowItems.length > 0 && (
        <OverflowMenu items={overflowItems} />
      )}
    </ActionButtonsContainer>
  );
}
