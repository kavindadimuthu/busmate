'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { BusStopManagementService, RouteManagementService } from '@busmate/api-client-core';
import type { RouteResponse, StopResponse } from '@busmate/api-client-core';

interface Props {
  route: RouteResponse;
  onChanged: (route: RouteResponse) => void;
}

function errorText(e: unknown): string {
  const body = (e as { body?: { message?: string } })?.body;
  return body?.message ?? (e instanceof Error ? e.message : 'Something went wrong');
}

/**
 * Adds one stop to a route that is only partly known (ADR-023, INC-051). It never rewrites the list, so schedule
 * times already attached to the route's stops are untouched.
 */
export function PlaceStopPanel({ route, onChanged }: Props) {
  const [open, setOpen] = useState(false);
  const [all, setAll] = useState<StopResponse[]>([]);
  const [stopId, setStopId] = useState('');
  const [afterId, setAfterId] = useState('');
  const [distance, setDistance] = useState('');
  const [busy, setBusy] = useState(false);

  const listed = [...(route.routeStops ?? [])].sort((a, b) => (a.stopOrder ?? 0) - (b.stopOrder ?? 0));
  // Nothing can come after the end of the route.
  const candidates = listed.filter((rs) => rs.stopId !== route.endStopId);
  const onRoute = new Set(listed.map((rs) => rs.stopId));

  useEffect(() => {
    if (!open || all.length) return;
    BusStopManagementService.getAllStopsAsList().then(setAll).catch((e) => toast.error(errorText(e)));
  }, [open, all.length]);

  const save = async () => {
    if (!stopId) { toast.error('Choose a stop'); return; }
    if (listed.length && !afterId) { toast.error('Say which stop it comes after'); return; }
    setBusy(true);
    try {
      const updated = await RouteManagementService.placeRouteStop(route.id as string, {
        stopId,
        afterRouteStopId: afterId || undefined,
        distanceFromStartKmUnverified: distance ? Number(distance) : undefined,
      });
      toast.success('Stop added');
      onChanged(updated);
      setStopId(''); setAfterId(''); setDistance(''); setOpen(false);
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const field = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm';

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg">
        <Plus className="w-4 h-4 mr-1.5" />Add a stop
      </button>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3" data-testid="place-stop-form">
      <label className="block text-sm">Stop
        <select aria-label="Stop to add" className={field} value={stopId} onChange={(e) => setStopId(e.target.value)}>
          <option value="">Choose a stop…</option>
          {all.filter((s) => !onRoute.has(s.id)).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>
      {listed.length > 0 && (
        <label className="block text-sm">Comes after
          <select aria-label="Comes after" className={field} value={afterId} onChange={(e) => setAfterId(e.target.value)}>
            <option value="">Choose…</option>
            {candidates.map((rs) => <option key={rs.id} value={rs.id}>{rs.stopName}</option>)}
          </select>
        </label>
      )}
      <label className="block text-sm">Distance from the start, km (optional, kept as unverified)
        <input aria-label="Distance from the start" type="number" min="0" step="0.1" className={field} value={distance} onChange={(e) => setDistance(e.target.value)} />
      </label>
      <div className="flex gap-2">
        <button disabled={busy} onClick={save} className="px-4 py-2 bg-primary text-white rounded-md text-sm disabled:opacity-50">Add</button>
        <button onClick={() => setOpen(false)} className="px-4 py-2 border border-border rounded-md text-sm">Cancel</button>
      </div>
    </div>
  );
}
