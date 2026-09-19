'use client';

import { useEffect, useState } from 'react';
import { UserRound } from 'lucide-react';
import { BusProfileService } from '@busmate/api-client-core';
import type { BusResponse } from '@busmate/api-client-core';
import { SectionCard, inputClassFor } from '@/components/shared/form-primitives';
import { getUser, listUsers } from '@/lib/api/adminUsers';
import { apiErrorMessage } from '@/lib/api/errors';

type Person = { id: string; name: string; status?: string };

/** The conductor who usually works this bus (design R5); pre-fills trip assignments. */
export function BusDefaultConductorCard({ bus, canEdit, onChanged }: { bus: BusResponse; canEdit: boolean; onChanged: () => void }) {
  const [crew, setCrew] = useState<Person[]>([]);
  const [current, setCurrent] = useState<Person | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (canEdit) {
      // user-service returns only the caller's own conductors to an operator (INC-019).
      listUsers({ userType: 'conductor', size: 200 })
        .then((page) => setCrew((page.content ?? []).map((u) => ({ id: u.userId!, name: u.fullName ?? u.email ?? 'Conductor', status: u.accountStatus }))))
        .catch(() => setCrew([]));
    }
  }, [canEdit]);

  useEffect(() => {
    if (!bus.defaultConductorId) {
      setCurrent(null);
      return;
    }
    getUser(bus.defaultConductorId)
      .then((u) => setCurrent({ id: u.userId!, name: u.fullName ?? u.email ?? 'Conductor' }))
      .catch(() => setCurrent({ id: bus.defaultConductorId!, name: 'Conductor' }));
  }, [bus.defaultConductorId]);

  const change = async (conductorId: string | null) => {
    if (!bus.id) return;
    setBusy(true);
    setError(null);
    try {
      await BusProfileService.setBusDefaultConductor(bus.id, { conductorId } as Record<string, string>);
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not change the usual conductor'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SectionCard title="Usual conductor" icon={<UserRound className="h-4 w-4 text-primary" />}>
      {canEdit && bus.status !== 'cancelled' ? (
        <select value={bus.defaultConductorId ?? ''} disabled={busy} onChange={(e) => change(e.target.value || null)}
          className={`${inputClassFor()} max-w-sm`} aria-label="Usual conductor">
          <option value="">No usual conductor</option>
          {crew.filter((c) => c.status === 'active' || c.id === bus.defaultConductorId).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      ) : (
        <p className="text-sm">{current?.name ?? 'None'}</p>
      )}
      <p className="text-xs text-muted-foreground">Suggested automatically when this bus is assigned to a trip.</p>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </SectionCard>
  );
}
