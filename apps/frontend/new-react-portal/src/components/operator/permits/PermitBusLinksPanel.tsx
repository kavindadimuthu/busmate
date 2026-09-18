'use client';

import { useState } from 'react';
import { Bus, Link2, Plus, Unlink } from 'lucide-react';
import { FormDialog } from '@busmate/ui';
import type { BusPassengerServicePermitAssignmentResponse, BusResponse, PassengerServicePermitResponse } from '@busmate/api-client-core';
import { Field, SectionCard, ToneBadge, inputClassFor } from '@/components/shared/form-primitives';
import { TONE_CLASSES, formatDate, requiredServiceClass } from '@/lib/permits';

interface PermitBusLinksPanelProps {
  permit: PassengerServicePermitResponse;
  links: BusPassengerServicePermitAssignmentResponse[];
  /** Buses the viewer may link (operator's own). Omit to hide the "Link a bus" action (MOT). */
  candidateBuses?: BusResponse[];
  busy?: boolean;
  error?: string | null;
  onLink?: (busId: string, startDate: string) => void;
  onEnd?: (link: BusPassengerServicePermitAssignmentResponse) => void;
  onOpenBus?: (busId: string) => void;
}

/** Which buses a permit authorises, and linking/ending them (INC-017, design R4). */
export function PermitBusLinksPanel({
  permit, links, candidateBuses, busy, error, onLink, onEnd, onOpenBus,
}: PermitBusLinksPanelProps) {
  const [open, setOpen] = useState(false);
  const [busId, setBusId] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));

  const inForce = links.filter((l) => l.inForce);
  const past = links.filter((l) => !l.inForce);
  const linkedIds = new Set(inForce.map((l) => l.busId));
  const neededClass = requiredServiceClass(permit.permitType);
  const eligible = (candidateBuses ?? []).filter(
    (b) => b.status === 'active' && b.serviceClass === neededClass && b.id && !linkedIds.has(b.id),
  );
  const atCap = inForce.length >= (permit.maximumBusAssigned ?? 0);
  const permitUsable = permit.status === 'active' && !permit.expired;
  const canLink = !!onLink && !!candidateBuses;

  return (
    <SectionCard
      title={`Authorised buses (${inForce.length} of ${permit.maximumBusAssigned})`}
      icon={<Link2 className="h-4 w-4 text-primary" />}
      actions={
        canLink && (
          <button
            type="button"
            onClick={() => {
              setBusId(eligible[0]?.id ?? '');
              setOpen(true);
            }}
            disabled={atCap || !permitUsable}
            title={!permitUsable ? 'Only an active, in-date permit can authorise buses' : atCap ? 'The permit is at its bus limit' : undefined}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" /> Link a bus
          </button>
        )
      }
    >
      {error && <p className="text-sm text-destructive">{error}</p>}
      {inForce.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No bus is authorised to run under this permit yet. Trips on this permit can only be given a linked bus.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {inForce.map((link) => (
            <li key={link.id} className="flex items-center justify-between gap-3 py-2.5">
              <button
                type="button"
                onClick={() => link.busId && onOpenBus?.(link.busId)}
                className="flex items-center gap-3 text-left min-w-0"
              >
                <Bus className="h-4 w-4 text-primary shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">{link.busPlateNumber}</span>
                  <span className="block text-xs text-muted-foreground">
                    {link.busModel ?? 'Model not recorded'} · since {formatDate(link.startDate)}
                    {link.endDate ? ` · until ${formatDate(link.endDate)}` : ''}
                  </span>
                </span>
              </button>
              {onEnd && (
                <button
                  type="button"
                  onClick={() => onEnd(link)}
                  disabled={busy}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs border border-border rounded-lg hover:bg-muted disabled:opacity-50"
                >
                  <Unlink className="h-3.5 w-3.5" /> End link
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {past.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">Past links ({past.length})</summary>
          <ul className="mt-2 space-y-1">
            {past.map((link) => (
              <li key={link.id} className="flex items-center gap-2 text-muted-foreground">
                <ToneBadge className={TONE_CLASSES.muted}>Ended</ToneBadge>
                {link.busPlateNumber} · {formatDate(link.startDate)} – {formatDate(link.endDate)}
              </li>
            ))}
          </ul>
        </details>
      )}

      {canLink && (
        <FormDialog open={open} onOpenChange={setOpen} title="Link a bus to this permit" size="md"
          description={`Only your active ${neededClass?.replace(/_/g, ' ').toLowerCase()} buses can run under a ${permit.permitType?.replace(/_/g, ' ').toLowerCase()} permit.`}>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (busId && onLink) {
                onLink(busId, startDate);
                setOpen(false);
              }
            }}
          >
            {eligible.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You have no active bus of the required class that is not already linked. Add or update a bus in Fleet first.
              </p>
            ) : (
              <>
                <Field label="Bus" required>
                  <select value={busId} onChange={(e) => setBusId(e.target.value)} className={inputClassFor()}>
                    {eligible.map((b) => (
                      <option key={b.id} value={b.id}>{b.plateNumber} — {b.model ?? 'model not recorded'}</option>
                    ))}
                  </select>
                </Field>
                <Field label="From" required>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClassFor()} />
                </Field>
              </>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">Cancel</button>
              <button type="submit" disabled={!busId || eligible.length === 0} className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg disabled:opacity-50">
                Link bus
              </button>
            </div>
          </form>
        </FormDialog>
      )}
    </SectionCard>
  );
}
