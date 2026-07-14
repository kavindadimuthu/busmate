'use client';

import React from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { Button } from '@busmate/ui';

// ── Props ─────────────────────────────────────────────────────────

interface SalaryActionButtonsProps {
  /** Callback for the export button. */
  onExport: () => void;
  /** Callback for the refresh button. */
  onRefresh: () => void;
  /** Whether data is currently loading. */
  isLoading: boolean;
}

// ── Component ─────────────────────────────────────────────────────

/**
 * Page-level action buttons for the salary management page.
 *
 * Rendered inside the page header via `useSetPageActions`.
 */
export function SalaryActionButtons({
  onExport,
  onRefresh,
  isLoading,
}: SalaryActionButtonsProps) {
  return (
    <>
      <Button
        variant="outline"
        onClick={onRefresh}
        disabled={isLoading}
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
      <Button onClick={onExport}>
        <Download className="h-4 w-4" />
        Export Report
      </Button>
    </>
  );
}
