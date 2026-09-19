'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bus, X } from 'lucide-react';
import { BusOperatorOperationsService, BusProfileService } from '@busmate/api-client-core';
import type { BusResponse } from '@busmate/api-client-core';
import { SectionCard, inputClassFor } from '@/components/shared/form-primitives';
import { apiErrorMessage } from '@/lib/api/errors';

/**
 * The buses this conductor usually works (design R5). A convenience that pre-fills trip
 * assignments; the trip's own conductor is what counts.
 */
export function ConductorBusCard({ operatorId, conductorId, canEdit, onOpenBus }: {
  operatorId: string;
  conductorId: string;
  canEdit: boolean;
  onOpenBus: (busId: string) => void;
}) {
  const [buses, setBuses] = useState<BusResponse[]>([]);
  const [choice, setChoice] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const page = await BusOperatorOperationsService.getOperatorBuses(operatorId, 0, 100, 'plateNumber', 'asc');
      setBuses(page.content ?? []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load buses'));
    }
  }, [operatorId]);

  useEffect(() => {
    load();
  }, [load]);

  const set = async (busId: string, value: string | null) => {
    setBusy(true);
    setError(null);
    try {
      await BusProfileService.setBusDefaultConductor(busId, { conductorId: value } as Record<string, string>);
      setChoice('');
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not update the bus'));
    } finally {
      setBusy(false);
    }
  };

  const mine = buses.filter((b) => b.defaultConductorId === conductorId);
  const others = buses.filter((b) => b.defaultConductorId !== conductorId && b.status === 'active');

  return (
    <SectionCard title="Usual bus" icon={<Bus className="h-4 w-4 text-primary" />}>
      <p className="text-xs text-muted-foreground">
        The conductor who usually works a bus is suggested automatically when you assign that bus to a trip.
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {mine.length === 0 ? (
        <p className="text-sm text-muted-foreground">Not the usual conductor of any bus.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {mine.map((b) => (
            <li key={b.id} className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm">
              <button type="button" className="pl-3 py-1" onClick={() => onOpenBus(b.id!)}>{b.plateNumber}</button>
              {canEdit && (
                <button type="button" disabled={busy} onClick={() => set(b.id!, null)} className="pr-2 py-1" aria-label={`Stop being the usual conductor of ${b.plateNumber}`}>
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {canEdit && others.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <select value={choice} onChange={(e) => setChoice(e.target.value)} className={`${inputClassFor()} max-w-xs`} aria-label="Bus to make this conductor's usual bus">
            <option value="">Choose a bus…</option>
            {others.map((b) => (
              <option key={b.id} value={b.id}>{b.plateNumber}{b.defaultConductorId ? ' (replaces current usual conductor)' : ''}</option>
            ))}
          </select>
          <button type="button" disabled={!choice || busy} onClick={() => set(choice, conductorId)}
            className="px-3 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg disabled:opacity-50">
            Make usual conductor
          </button>
        </div>
      )}
    </SectionCard>
  );
}
