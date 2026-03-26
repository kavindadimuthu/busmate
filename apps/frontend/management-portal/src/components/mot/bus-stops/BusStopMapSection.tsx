'use client';

import { Navigation, ExternalLink } from 'lucide-react';
import type { StopResponse } from '@busmate/api-client-route';
import BusStopMiniMap from './BusStopMiniMap';
import CopyableField from './CopyableField';

interface BusStopMapSectionProps {
  busStop: StopResponse;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
  onOpenInMaps: () => void;
}

export default function BusStopMapSection({ busStop, copiedField, onCopy, onOpenInMaps }: BusStopMapSectionProps) {
  const lat = busStop.location!.latitude!;
  const lng = busStop.location!.longitude!;

  return (
    <div className="bg-card rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
        <Navigation className="w-5 h-5 mr-2" />
        Location Map
      </h3>
      <BusStopMiniMap
        latitude={lat}
        longitude={lng}
        name={busStop.name || 'Bus Stop'}
        address={busStop.location?.address}
        onCopyCoordinates={onCopy}
      />

      {/* Coordinates Display */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-foreground/80">Coordinates</label>
          <button
            onClick={onOpenInMaps}
            className="flex items-center text-xs text-primary hover:text-primary transition-colors"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Open in Maps
          </button>
        </div>
        <CopyableField
          value={`${lat.toFixed(6)}, ${lng.toFixed(6)}`}
          field="map-coordinates"
          copiedField={copiedField}
          onCopy={onCopy}
          className="text-xs font-mono text-foreground bg-muted p-2 rounded"
        />
        <div className="text-xs text-muted-foreground">
          Lat: {lat.toFixed(6)} · Lng: {lng.toFixed(6)}
        </div>
      </div>
    </div>
  );
}
