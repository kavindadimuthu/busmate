'use client';

import { useEffect, useState } from 'react';
import { CalendarClock, Wrench } from 'lucide-react';
import { FormDialog } from '@busmate/ui';
import { BusProfileService } from '@busmate/api-client-core';
import type { BusResponse } from '@busmate/api-client-core';
import { Field, SectionCard, ToneBadge, inputClassFor } from '@/components/shared/form-primitives';
import { AVAILABILITY } from '@/lib/fleet';
import { TONE_CLASSES, formatDate, localToday } from '@/lib/permits';
import { apiErrorMessage } from '@/lib/api/errors';

const today = localToday;

/**
 * Day-to-day availability (INC-018, design R3): the operator marks a bus under maintenance or off
 * the road for a window. Shows how many already-assigned trips the window touches before saving.
 */
export function BusAvailabilityCard({ bus, canEdit, onChanged }: { bus: BusResponse; canEdit: boolean; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ availability: 'UNDER_MAINTENANCE', from: today(), until: '', note: '' });
  const [impact, setImpact] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unavailable = bus.availability && bus.availability !== 'AVAILABLE';
  const label = AVAILABILITY.find((a) => a.value === bus.availability)?.label ?? 'Available';

  useEffect(() => {
    if (!open || !bus.id || draft.availability === 'AVAILABLE') {
      setImpact(null);
      return;
    }
    let cancelled = false;
    BusProfileService.getBusAvailabilityImpact(bus.id, draft.from || undefined, draft.until || undefined)
      .then((r) => !cancelled && setImpact(r.pendingTrips ?? 0))
      .catch(() => !cancelled && setImpact(null));
    return () => {
      cancelled = true;
    };
  }, [open, bus.id, draft.availability, draft.from, draft.until]);

  const save = async (availability = draft.availability) => {
    if (!bus.id) return;
    setBusy(true);
    setError(null);
    try {
      await BusProfileService.setBusAvailability(bus.id, availability === 'AVAILABLE'
        ? { availability }
        : { availability, from: draft.from || undefined, until: draft.until || undefined, note: draft.note || undefined });
      setOpen(false);
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not update availability'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SectionCard
      title="Availability"
      icon={<CalendarClock className="h-4 w-4 text-primary" />}
      actions={canEdit && bus.status !== 'cancelled' && (
        <div className="flex gap-2">
          {unavailable && (
            <button type="button" onClick={() => save('AVAILABLE')} disabled={busy} className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted disabled:opacity-50">
              Mark available
            </button>
          )}
          <button type="button" onClick={() => { setError(null); setOpen(true); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
            <Wrench className="h-3.5 w-3.5" /> Take out of use
          </button>
        </div>
      )}
    >
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <ToneBadge className={bus.availableToday ? TONE_CLASSES.success : TONE_CLASSES.warning}>
          {bus.availableToday ? 'Can run today' : 'Not running today'}
        </ToneBadge>
        {unavailable ? (
          <span className="text-muted-foreground">
            {label} from {formatDate(bus.availabilityFrom)} {bus.availabilityUntil ? `to ${formatDate(bus.availabilityUntil)}` : 'until further notice'}
            {bus.availabilityNote ? ` — ${bus.availabilityNote}` : ''}
          </span>
        ) : (
          <span className="text-muted-foreground">Available for trips.</span>
        )}
      </div>
      {error && !open && <p className="text-sm text-destructive">{error}</p>}

      <FormDialog open={open} onOpenChange={setOpen} title="Take this bus out of use" size="md"
        description="Trips on these days cannot be given this bus. Trips it is already assigned to need another bus.">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <Field label="Reason" required>
            <select value={draft.availability} onChange={(e) => setDraft({ ...draft, availability: e.target.value })} className={inputClassFor()}>
              {AVAILABILITY.filter((a) => a.value !== 'AVAILABLE').map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="From" required>
              <input type="date" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} className={inputClassFor()} />
            </Field>
            <Field label="Until" hint="Empty = until further notice">
              <input type="date" value={draft.until} min={draft.from} onChange={(e) => setDraft({ ...draft, until: e.target.value })} className={inputClassFor()} />
            </Field>
          </div>
          <Field label="Note">
            <input value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} maxLength={500} placeholder="e.g. Gearbox overhaul at depot" className={inputClassFor()} />
          </Field>
          {impact !== null && impact > 0 && (
            <p className="text-sm p-3 rounded-lg bg-warning/10 border border-warning/20">
              This bus is assigned to {impact} pending trip(s) in this period. Reassign them from Trips.
            </p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">Cancel</button>
            <button type="submit" disabled={busy} className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg disabled:opacity-50">
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </FormDialog>
    </SectionCard>
  );
}
