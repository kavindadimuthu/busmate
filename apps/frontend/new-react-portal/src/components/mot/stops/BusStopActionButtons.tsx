'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Upload,
  Download,
  CheckSquare,
} from 'lucide-react';
import { Button } from '@busmate/ui';

interface BusStopActionButtonsProps {
  onAddBusStop: () => void;
  onImportBusStops: () => void;
  onBulkOperations?: () => void;
  isLoading?: boolean;
  selectedCount?: number;
}

/**
 * Bus-stop page action buttons.
 */
export function BusStopActionButtons({
  onAddBusStop,
  onImportBusStops,
  onBulkOperations,
  isLoading = false,
  selectedCount = 0,
}: BusStopActionButtonsProps) {
  const router = useRouter();
  const handleExport = () => router.push('/mot/stops/export');

  return (
    <div className="flex items-center gap-2">
      {/* Bulk — sm+ only, when items are selected */}
      {selectedCount > 0 && onBulkOperations && (
        <Button
          variant="outline"
          className="hidden sm:inline-flex border-orange-200 text-orange-700 hover:bg-orange-50"
          onClick={onBulkOperations}
          disabled={isLoading}
        >
          <CheckSquare className="h-4 w-4" />
          Bulk Actions
          <span className="ml-0.5 inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] rounded-full bg-orange-100 text-[10px] font-bold px-1">{selectedCount}</span>
        </Button>
      )}

      {/* Export — sm+ only */}
      <Button variant="outline" onClick={handleExport} disabled={isLoading} className="hidden sm:inline-flex">
        <Download className="h-4 w-4" />
        Export
      </Button>

      {/* Import — sm+ only */}
      <Button variant="ghost" onClick={onImportBusStops} disabled={isLoading} className="hidden sm:inline-flex">
        <Upload className="h-4 w-4" />
        Import
      </Button>

      {/* Add Bus Stop — always visible (primary CTA) */}
      <Button onClick={onAddBusStop} disabled={isLoading}>
        <Plus className="h-4 w-4" />
        Add Bus Stop
      </Button>
    </div>
  );
}