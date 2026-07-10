'use client';

import { ArrowLeft, RefreshCw, Edit2, Trash2, Play, Square, CheckCircle } from 'lucide-react';
import { Button } from '@busmate/ui';
import type { TripResponse } from '@busmate/api-client-route';

interface TripDetailsActionsProps {
  trip: TripResponse | null;
  canStart: (status?: string) => boolean;
  canComplete: (status?: string) => boolean;
  canCancel: (status?: string) => boolean;
  canEdit: (status?: string) => boolean;
  onBack: () => void;
  onRefresh: () => void;
  onStart: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TripDetailsActions({
  trip, canStart, canComplete, canCancel, canEdit,
  onBack, onRefresh, onStart, onComplete, onCancel, onEdit, onDelete,
}: TripDetailsActionsProps) {
  return (
    <div className="flex items-center space-x-2">
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      <Button variant="outline" size="sm" onClick={onRefresh}>
        <RefreshCw className="h-4 w-4" />
      </Button>
      {trip && canStart(trip.status) && (
        <Button size="sm" onClick={onStart}>
          <Play className="h-4 w-4 mr-2" />
          Start Trip
        </Button>
      )}
      {trip && canComplete(trip.status) && (
        <Button size="sm" onClick={onComplete}>
          <CheckCircle className="h-4 w-4 mr-2" />
          Complete Trip
        </Button>
      )}
      {trip && canCancel(trip.status) && (
        <Button variant="outline" size="sm" onClick={onCancel}>
          <Square className="h-4 w-4 mr-2" />
          Cancel Trip
        </Button>
      )}
      {trip && canEdit(trip.status) && (
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit2 className="h-4 w-4 mr-2" />
          Edit
        </Button>
      )}
      {trip && (
        <Button variant="outline" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      )}
    </div>
  );
}
