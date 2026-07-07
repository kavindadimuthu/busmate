'use client';

import React from 'react';
import { Download, RotateCcw, FileText, Play, CheckSquare, Square } from 'lucide-react';
import { Button } from '@busmate/ui';

interface TripActionButtonsProps {
  onAddTrip: () => void;
  onGenerateTrips: () => void;
  onExportAll: () => void;
  onBulkOperations?: () => void;
  onBulkAssignPsp?: () => void;
  onBulkStart?: () => void;
  onBulkComplete?: () => void;
  onBulkCancel?: () => void;
  isLoading?: boolean;
  selectedCount?: number;
}

export function TripActionButtons({
  onGenerateTrips,
  onExportAll,
  onBulkAssignPsp,
  onBulkStart,
  onBulkComplete,
  onBulkCancel,
  isLoading = false,
  selectedCount = 0,
}: TripActionButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      {selectedCount > 0 && onBulkCancel && (
        <Button variant="destructive" onClick={onBulkCancel} disabled={isLoading} className="hidden lg:inline-flex">
          <Square className="h-4 w-4" /> Cancel
          <span className="ml-0.5 inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] rounded-full bg-white/30 text-[10px] font-bold px-1">{selectedCount}</span>
        </Button>
      )}
      {selectedCount > 0 && onBulkComplete && (
        <Button variant="success" onClick={onBulkComplete} disabled={isLoading} className="hidden lg:inline-flex">
          <CheckSquare className="h-4 w-4" /> Complete
          <span className="ml-0.5 inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] rounded-full bg-white/30 text-[10px] font-bold px-1">{selectedCount}</span>
        </Button>
      )}
      {selectedCount > 0 && onBulkStart && (
        <Button variant="success" onClick={onBulkStart} disabled={isLoading} className="hidden lg:inline-flex">
          <Play className="h-4 w-4" /> Start
          <span className="ml-0.5 inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] rounded-full bg-white/30 text-[10px] font-bold px-1">{selectedCount}</span>
        </Button>
      )}
      {selectedCount > 0 && onBulkAssignPsp && (
        <Button variant="ghost" onClick={onBulkAssignPsp} disabled={isLoading} className="hidden lg:inline-flex">
          <FileText className="h-4 w-4" /> Assign PSP
          <span className="ml-0.5 inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] rounded-full bg-white/30 text-[10px] font-bold px-1">{selectedCount}</span>
        </Button>
      )}
      <Button variant="outline" onClick={onExportAll} disabled={isLoading} className="hidden sm:inline-flex">
        <Download className="h-4 w-4" /> Export
      </Button>
      <Button onClick={onGenerateTrips} disabled={isLoading}>
        <RotateCcw className="h-4 w-4" /> Generate Trips
      </Button>
    </div>
  );
}
