'use client';

import { GoogleMap, Marker } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';
import type { ChangesetResponse, StopResponse } from '@busmate/api-client-core';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';

interface ProposedStopValues {
  name?: string;
  nameSinhala?: string;
  nameTamil?: string;
  description?: string;
  isAccessible?: boolean;
  location?: { latitude?: number; longitude?: number; city?: string };
}

const FIELDS: { key: keyof ProposedStopValues; label: string }[] = [
  { key: 'name', label: 'Name (English)' },
  { key: 'nameSinhala', label: 'Name (Sinhala)' },
  { key: 'nameTamil', label: 'Name (Tamil)' },
  { key: 'description', label: 'Description' },
];

function display(v: unknown): string {
  if (v === undefined || v === null || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return String(v);
}

/** Current values next to proposed, changed fields highlighted, plus both positions on a map. */
export function StopProposalDiff({
  changeset,
  currentStop,
  positionDistanceMeters,
}: {
  changeset?: ChangesetResponse;
  currentStop?: StopResponse | null;
  positionDistanceMeters?: number | null;
}) {
  const { isReady, loadError } = useGoogleMaps();
  const proposed = (changeset?.proposedValues ?? {}) as ProposedStopValues;
  const isCorrection = changeset?.action === 'UPDATE';

  const currentPos =
    currentStop?.location?.latitude != null && currentStop?.location?.longitude != null
      ? { lat: currentStop.location.latitude, lng: currentStop.location.longitude }
      : null;
  const proposedPos =
    proposed.location?.latitude != null && proposed.location?.longitude != null
      ? { lat: proposed.location.latitude, lng: proposed.location.longitude }
      : null;
  const center = proposedPos ?? currentPos ?? { lat: 7.29, lng: 80.63 };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Field</th>
              {isCorrection && <th className="text-left px-3 py-2 font-medium text-muted-foreground">Current</th>}
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Proposed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {FIELDS.map(({ key, label }) => {
              const beforeVal = isCorrection ? (currentStop as any)?.[key] : undefined;
              const afterVal = proposed[key];
              const changed = isCorrection && beforeVal !== afterVal;
              return (
                <tr key={key}>
                  <td className="px-3 py-2 text-muted-foreground">{label}</td>
                  {isCorrection && <td className="px-3 py-2">{display(beforeVal)}</td>}
                  <td className={`px-3 py-2 ${changed ? 'font-semibold bg-primary/5' : ''}`}>{display(afterVal)}</td>
                </tr>
              );
            })}
            <tr>
              <td className="px-3 py-2 text-muted-foreground">Wheelchair accessible</td>
              {isCorrection && <td className="px-3 py-2">{display(currentStop?.isAccessible)}</td>}
              <td className={`px-3 py-2 ${isCorrection && currentStop?.isAccessible !== proposed.isAccessible ? 'font-semibold bg-primary/5' : ''}`}>
                {display(proposed.isAccessible)}
              </td>
            </tr>
            <tr>
              <td className="px-3 py-2 text-muted-foreground">City</td>
              {isCorrection && <td className="px-3 py-2">{display(currentStop?.location?.city)}</td>}
              <td className="px-3 py-2">{display(proposed.location?.city)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {loadError ? (
        <p className="text-sm text-destructive">The map couldn't load.</p>
      ) : !isReady ? (
        <div className="flex items-center justify-center h-[240px] bg-muted rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2">
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '240px', borderRadius: '0.5rem' }}
            center={center}
            zoom={currentPos && proposedPos ? 15 : 14}
            options={{ streetViewControl: false, mapTypeControl: false }}
          >
            {currentPos && (
              <Marker position={currentPos} label={{ text: 'Current', className: 'text-xs' }}
                icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/grey-dot.png' }} />
            )}
            {proposedPos && (
              <Marker position={proposedPos} label={{ text: 'Proposed', className: 'text-xs' }} />
            )}
          </GoogleMap>
          {positionDistanceMeters != null && (
            <p className="text-xs text-muted-foreground">
              {Math.round(positionDistanceMeters)}m between the current and proposed position.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
