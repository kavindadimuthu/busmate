'use client';

import { Clock, User } from 'lucide-react';
import type { StopResponse } from '@busmate/api-client-route';

interface BusStopSystemInfoProps {
  busStop: StopResponse;
  formatDate: (dateString?: string) => string;
}

export default function BusStopSystemInfo({ busStop, formatDate }: BusStopSystemInfoProps) {
  return (
    <div className="bg-card rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
        <Clock className="w-5 h-5 mr-2" />
        System Information
      </h3>
      <div className="space-y-4 text-sm">
        {busStop.createdAt && (
          <div>
            <label className="block font-medium text-foreground/80 mb-1">Created At</label>
            <p className="text-muted-foreground">{formatDate(busStop.createdAt)}</p>
          </div>
        )}

        {busStop.createdBy && (
          <div>
            <label className="block font-medium text-foreground/80 mb-1">Created By</label>
            <div className="flex items-center text-muted-foreground">
              <User className="w-4 h-4 mr-1" />
              {busStop.createdBy}
            </div>
          </div>
        )}

        {busStop.updatedAt && (
          <div>
            <label className="block font-medium text-foreground/80 mb-1">Last Updated</label>
            <p className="text-muted-foreground">{formatDate(busStop.updatedAt)}</p>
          </div>
        )}

        {busStop.updatedBy && (
          <div>
            <label className="block font-medium text-foreground/80 mb-1">Updated By</label>
            <div className="flex items-center text-muted-foreground">
              <User className="w-4 h-4 mr-1" />
              {busStop.updatedBy}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
