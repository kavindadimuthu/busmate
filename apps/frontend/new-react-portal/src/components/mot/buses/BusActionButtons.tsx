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

interface BusActionButtonsProps {
  onAddBus: () => void;
  onImportBuses: () => void;
  onExportAll: () => void;
  onBulkOperations?: () => void;
  isLoading?: boolean;
  selectedCount?: number;
}

export function BusActionButtons({
  onAddBus,
  onImportBuses,
  onExportAll,
  isLoading = false,
}: BusActionButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button onClick={onAddBus} disabled={isLoading}>
        <Plus className="h-4 w-4" />
        Add Bus
      </Button>
      <Button variant="outline" onClick={onImportBuses} disabled={isLoading} className="hidden sm:inline-flex">
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
          <DropdownMenuItem onClick={onImportBuses} disabled={isLoading}>
            <Upload className="h-3.5 w-3.5" />
            Import Buses
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
