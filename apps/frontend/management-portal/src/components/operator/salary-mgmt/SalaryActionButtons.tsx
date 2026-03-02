'use client';

import React from 'react';
import { Download, RefreshCw, FileSpreadsheet } from 'lucide-react';
import { ActionButton } from '@/components/shared/ActionButton';

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
      <ActionButton
        icon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />}
        label="Refresh"
        variant="secondary"
        onClick={onRefresh}
        disabled={isLoading}
      />
      <ActionButton
        icon={<Download className="h-4 w-4" />}
        label="Export Report"
        variant="primary"
        onClick={onExport}
      />
    </>
  );
}
