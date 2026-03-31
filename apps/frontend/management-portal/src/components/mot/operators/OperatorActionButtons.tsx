'use client';

import React from 'react';
import { Plus, Upload, Download, MoreHorizontal } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@busmate/ui';

// ── Types ─────────────────────────────────────────────────────────

interface OperatorActionButtonsProps {
  onAddOperator: () => void;
  onImportOperators: () => void;
  onExportAll: () => void;
  isLoading?: boolean;
}

// ── Component ─────────────────────────────────────────────────────

export function OperatorActionButtons({
  onAddOperator,
  onImportOperators,
  onExportAll,
  isLoading = false,
}: OperatorActionButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button onClick={onAddOperator} disabled={isLoading}>
        <Plus className="h-4 w-4" />
        Add Operator
      </Button>
      <Button variant="ghost" onClick={onImportOperators} disabled={isLoading} className="hidden sm:inline-flex">
        <Upload className="h-4 w-4" />
        Import
      </Button>
      <Button variant="outline" onClick={onExportAll} disabled={isLoading} className="hidden sm:inline-flex">
        <Download className="h-4 w-4" />
        Export All
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="sm:hidden">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onImportOperators} disabled={isLoading}>
            <Upload className="h-3.5 w-3.5" />
            Import
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportAll} disabled={isLoading}>
            <Download className="h-3.5 w-3.5" />
            Export All
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
