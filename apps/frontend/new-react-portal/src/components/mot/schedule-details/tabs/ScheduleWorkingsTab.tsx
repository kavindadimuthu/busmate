'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Users, Plus, Trash2, CalendarX } from 'lucide-react';
import {
  ScheduleResponse,
  ScheduleWorkingRequest,
  ScheduleWorkingResponse,
  ScheduleWorkingsService,
} from '@busmate/api-client-core';
import { LinkWorkingDialog } from './LinkWorkingDialog';

interface Props {
  schedule: ScheduleResponse;
}

const TRUST_STYLE: Record<string, string> = {
  OFFICIAL: 'bg-success/15 text-success',
  OBSERVED: 'bg-primary/15 text-primary',
  REPORTED: 'bg-muted text-muted-foreground',
};

// The local day, as the person at the desk means it: toISOString is UTC, a day behind Sri Lanka for the first hours after midnight.
const today = () => new Date().toLocaleDateString('en-CA');

function errorText(e: unknown): string {
  const body = (e as { body?: { message?: string } })?.body;
  return body?.message ?? (e instanceof Error ? e.message : 'Something went wrong');
}

/** Who normally works this departure. A claim about a pattern, never about a day (ADR-024). */
export function ScheduleWorkingsTab({ schedule }: Props) {
  const scheduleId = schedule.id as string;
  const [workings, setWorkings] = useState<ScheduleWorkingResponse[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [operator, setOperator] = useState('');
  const [plates, setPlates] = useState('');
  const [serviceClass, setServiceClass] = useState('');
  const [start, setStart] = useState('');
  const [observedOn, setObservedOn] = useState('');

  const load = useCallback(async () => {
    try {
      setWorkings(await ScheduleWorkingsService.listScheduleWorkings(scheduleId));
    } catch (e) {
      toast.error(errorText(e));
      setWorkings([]);
    }
  }, [scheduleId]);

  useEffect(() => { void load(); }, [load]);

  const reset = () => { setOperator(''); setPlates(''); setServiceClass(''); setStart(''); setObservedOn(''); setAdding(false); };

  const save = async () => {
    const vehicles = plates.split(',').map((p) => p.trim()).filter(Boolean).map((plateObserved) => ({ plateObserved }));
    if (!operator.trim() && vehicles.length === 0 && !serviceClass) {
      toast.error('Give an operator, a plate or a service class');
      return;
    }
    const request: ScheduleWorkingRequest = {
      operatorNameObserved: operator.trim() || undefined,
      vehicles: vehicles.length ? vehicles : undefined,
      serviceClass: (serviceClass || undefined) as ScheduleWorkingRequest.serviceClass | undefined,
      effectiveStartDate: start || undefined,
      observedOn: observedOn || undefined,
    };
    setBusy(true);
    try {
      await ScheduleWorkingsService.createScheduleWorking(scheduleId, request);
      toast.success('Working recorded');
      reset();
      await load();
    } catch (e) {
      toast.error(errorText(e)); // an overlap for the same operator arrives as a plain 409 message
    } finally {
      setBusy(false);
    }
  };

  const endToday = async (id: string) => {
    try {
      await ScheduleWorkingsService.endScheduleWorking(id, { effectiveEndDate: today() });
      await load();
    } catch (e) { toast.error(errorText(e)); }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Remove this working? Use "End today" instead if it simply stopped.')) return;
    try {
      await ScheduleWorkingsService.deleteScheduleWorking(id);
      await load();
    } catch (e) { toast.error(errorText(e)); }
  };

  const input = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm';

  return (
    <div className="space-y-6" data-testid="workings-tab">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-foreground">Usual workings</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Who normally runs this departure. Shown to passengers as “usually”, never as a promise for a given day.
          </p>
        </div>
        <button onClick={() => setAdding(true)} className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md text-sm">
          <Plus className="w-4 h-4 mr-2" />Record a working
        </button>
      </div>

      {adding && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-3" data-testid="working-form">
          <label className="block text-sm">Operator, as seen
            <input aria-label="Operator as seen" className={input} value={operator} onChange={(e) => setOperator(e.target.value)} placeholder="e.g. Weerasinghe Midnight Express" />
          </label>
          <label className="block text-sm">Plates, comma separated
            <input aria-label="Plates" className={input} value={plates} onChange={(e) => setPlates(e.target.value)} placeholder="ND-1712, ND-1713" />
            <span className="text-xs text-muted-foreground">One plate means this vehicle; several mean the operator alternates among them.</span>
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-sm">Service class
              <select aria-label="Service class" className={input} value={serviceClass} onChange={(e) => setServiceClass(e.target.value)}>
                <option value="">Not stated</option>
                {Object.values(ScheduleWorkingRequest.serviceClass).map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
              </select>
            </label>
            <label className="block text-sm">Applies from
              <input aria-label="Applies from" type="date" className={input} value={start} max={today()} onChange={(e) => setStart(e.target.value)} />
            </label>
            <label className="block text-sm">Information dates from
              <input aria-label="Information dates from" type="date" className={input} value={observedOn} max={today()} onChange={(e) => setObservedOn(e.target.value)} />
            </label>
          </div>
          <div className="flex gap-2">
            <button disabled={busy} onClick={save} className="px-4 py-2 bg-primary text-white rounded-md text-sm disabled:opacity-50">Save</button>
            <button onClick={reset} className="px-4 py-2 border border-border rounded-md text-sm">Cancel</button>
          </div>
        </div>
      )}

      {workings === null ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : workings.length === 0 ? (
        <div className="text-center py-10">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/70 mb-3" />
          <p className="text-muted-foreground">No one is recorded as usually working this departure.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {workings.map((w) => (
            <li key={w.id} className="bg-card border border-border rounded-lg p-4" data-testid="working-row">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-foreground flex items-center gap-2 flex-wrap">
                    {w.operatorName ?? w.operatorNameObserved ?? 'Operator not stated'}
                    {!w.operatorResolved && w.operatorNameObserved && (
                      <>
                        <span className="text-xs text-muted-foreground">not a registered operator</span>
                        <LinkWorkingDialog
                          target={{ kind: 'operator', workingId: w.id as string, observedName: w.operatorNameObserved }}
                          onLinked={load}
                        />
                      </>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {w.vehicles?.length ? w.vehicles.map((v) => v.plate ?? v.plateObserved).join(' · ') : 'No plate recorded'}
                  </p>
                  {w.vehicles?.filter((v) => !v.resolved && v.plateObserved).map((v) => (
                    <p key={v.id} className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                      {v.plateObserved} is not a registered bus
                      <LinkWorkingDialog
                        target={{ kind: 'bus', vehicleId: v.id as string, observedPlate: v.plateObserved as string, operatorId: w.operatorId }}
                        onLinked={load}
                      />
                    </p>
                  ))}
                  {w.serviceClass && <p className="text-sm text-muted-foreground">{w.serviceClass.replace(/_/g, ' ')}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    From {w.effectiveStartDate}{w.effectiveEndDate ? ` to ${w.effectiveEndDate}` : ', still current'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${TRUST_STYLE[w.trust?.label ?? 'REPORTED'] ?? TRUST_STYLE.REPORTED}`}>
                    {w.trust?.label ?? 'REPORTED'}
                  </span>
                  {!w.effectiveEndDate && (
                    <button onClick={() => endToday(w.id as string)} title="End today" className="p-2 text-muted-foreground hover:text-foreground"><CalendarX className="w-4 h-4" /></button>
                  )}
                  <button onClick={() => remove(w.id as string)} title="Remove" className="p-2 text-destructive"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
