'use client';

import { Check, X } from 'lucide-react';
import type { StopResponse } from '@busmate/api-client-route';
import CopyableField from './CopyableField';

interface BusStopBasicInfoProps {
  busStop: StopResponse;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}

export default function BusStopBasicInfo({ busStop, copiedField, onCopy }: BusStopBasicInfoProps) {
  return (
    <div className="bg-card rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Basic Information</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1">Stop Name</label>
          <CopyableField
            value={busStop.name || 'N/A'}
            field="name"
            copiedField={copiedField}
            onCopy={onCopy}
            className="text-lg font-medium text-foreground"
          />
        </div>

        {busStop.description && (
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">Description</label>
            <p className="text-muted-foreground leading-relaxed">{busStop.description}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1">Stop ID</label>
          <CopyableField
            value={busStop.id || 'N/A'}
            field="id"
            copiedField={copiedField}
            onCopy={onCopy}
            className="text-sm font-mono text-muted-foreground"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1">Accessibility</label>
          <div className="flex items-center gap-2">
            {busStop.isAccessible ? (
              <>
                <Check className="w-5 h-5 text-success/80" />
                <span className="text-success font-medium">Accessible</span>
              </>
            ) : (
              <>
                <X className="w-5 h-5 text-destructive/80" />
                <span className="text-destructive font-medium">Not Accessible</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
