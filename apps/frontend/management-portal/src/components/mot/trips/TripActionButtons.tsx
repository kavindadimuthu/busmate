'use client';

import React from 'react';
import { Download, RotateCcw, FileText, Play, CheckSquare, Square } from 'lucide-react';
import { ActionButton, ActionButtonsContainer } from '@/components/shared/ActionButton';

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
    <ActionButtonsContainer>
      {selectedCount > 0 && onBulkCancel && (
        <ActionButton icon={<Square className="h-4 w-4" />} label="Cancel" badge={selectedCount} variant="danger" onClick={onBulkCancel} disabled={isLoading} className="hidden lg:inline-flex" />
      )}
      {selectedCount > 0 && onBulkComplete && (
        <ActionButton icon={<CheckSquare className="h-4 w-4" />} label="Complete" badge={selectedCount} variant="success" onClick={onBulkComplete} disabled={isLoading} className="hidden lg:inline-flex" />
      )}
      {selectedCount > 0 && onBulkStart && (
        <ActionButton icon={<Play className="h-4 w-4" />} label="Start" badge={selectedCount} variant="success" onClick={onBulkStart} disabled={isLoading} className="hidden lg:inline-flex" />
      )}
      {selectedCount > 0 && onBulkAssignPsp && (
        <ActionButton icon={<FileText className="h-4 w-4" />} label="Assign PSP" badge={selectedCount} variant="ghost" onClick={onBulkAssignPsp} disabled={isLoading} className="hidden lg:inline-flex" />
      )}
      <ActionButton icon={<Download className="h-4 w-4" />} label="Export" variant="secondary" onClick={onExportAll} disabled={isLoading} className="hidden sm:inline-flex" />
      <ActionButton icon={<RotateCcw className="h-4 w-4" />} label="Generate Trips" variant="primary" onClick={onGenerateTrips} disabled={isLoading} />
    </ActionButtonsContainer>
  );
}
