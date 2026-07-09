'use client';

import React from 'react';
import { Download, Info } from 'lucide-react';
import { Button } from '@busmate/ui';

// ── Types ─────────────────────────────────────────────────────────

interface OperatorActionButtonsProps {
  onExportAll: () => void;
  isLoading?: boolean;
}

// ── Component ─────────────────────────────────────────────────────

/**
 * No "Add Operator" / "Import" here — operators are created from the Admin dashboard's
 * User Management (operator-type accounts), which drives the unified lifecycle sync into
 * core-service. See docs/plans/Unified-Operator-Lifecycle-Management-Plan.md Step 3.
 */
export function OperatorActionButtons({
  onExportAll,
  isLoading = false,
}: OperatorActionButtonsProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5" />
        New operators are created from Admin &rarr; User Management
      </span>
      <Button variant="outline" onClick={onExportAll} disabled={isLoading}>
        <Download className="h-4 w-4" />
        Export All
      </Button>
    </div>
  );
}
