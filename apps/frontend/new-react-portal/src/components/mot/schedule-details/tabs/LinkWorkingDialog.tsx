'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Link2 } from 'lucide-react';
import {
  BusManagementService,
  OperatorManagementService,
  ScheduleWorkingsService,
} from '@busmate/api-client-core';
import type { BusResponse, OperatorResponse } from '@busmate/api-client-core';

function errorText(e: unknown): string {
  const body = (e as { body?: { message?: string } })?.body;
  return body?.message ?? (e instanceof Error ? e.message : 'Something went wrong');
}

type Target =
  | { kind: 'operator'; workingId: string; observedName: string }
  | { kind: 'bus'; vehicleId: string; observedPlate: string; operatorId?: string };

/**
 * Links a name or plate a contributor or staff member only saw to the real registry record it is (INC-057,
 * ADR-024). The observed text is kept either way — this only adds the link, it never overwrites what was seen.
 */
export function LinkWorkingDialog({ target, onLinked }: { target: Target; onLinked: () => void }) {
  const [open, setOpen] = useState(false);
  const [operators, setOperators] = useState<OperatorResponse[] | null>(null);
  const [buses, setBuses] = useState<BusResponse[] | null>(null);
  const [chosen, setChosen] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setChosen('');
    if (target.kind === 'operator' && !operators) {
      OperatorManagementService.getAllOperatorsAsList().then(setOperators).catch((e) => toast.error(errorText(e)));
    }
    if (target.kind === 'bus' && !buses) {
      BusManagementService.getAllBusesAsList().then(setBuses).catch((e) => toast.error(errorText(e)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, target.kind]);

  const options =
    target.kind === 'operator'
      ? (operators ?? []).map((o) => ({ id: o.id as string, label: o.name ?? o.id! }))
      : (buses ?? [])
          // Once the operator side is linked, only that operator's own fleet makes sense here — the server
          // enforces the same rule and would refuse a mismatch anyway.
          .filter((b) => !target.operatorId || b.operatorId === target.operatorId)
          .map((b) => ({ id: b.id as string, label: `${b.plateNumber} — ${b.operatorName ?? 'no operator yet'}` }));

  const link = async () => {
    if (!chosen) return;
    setBusy(true);
    try {
      if (target.kind === 'operator') {
        await ScheduleWorkingsService.resolveScheduleWorkingOperator(target.workingId, { operatorId: chosen });
      } else {
        await ScheduleWorkingsService.resolveScheduleWorkingBus(target.vehicleId, { busId: chosen });
      }
      toast.success('Linked');
      setOpen(false);
      onLinked();
    } catch (e) {
      toast.error(errorText(e)); // e.g. "registered to a different operator than this working"
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        title={target.kind === 'operator' ? `Link "${target.observedName}" to a registered operator` : `Link "${target.observedPlate}" to a registered bus`}
      >
        <Link2 className="w-3 h-3" />
        Link
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <select
        aria-label={target.kind === 'operator' ? `Operator for ${target.observedName}` : `Bus for ${target.observedPlate}`}
        className="rounded-md border border-border bg-background px-2 py-1 text-xs"
        value={chosen}
        onChange={(e) => setChosen(e.target.value)}
        autoFocus
      >
        <option value="">Choose…</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <button disabled={!chosen || busy} onClick={link} className="text-xs text-primary disabled:opacity-50">
        Save
      </button>
      <button onClick={() => setOpen(false)} className="text-xs text-muted-foreground">
        Cancel
      </button>
    </span>
  );
}
