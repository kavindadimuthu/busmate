'use client';

import { useCallback, useEffect, useState } from 'react';
import { BusOperatorOperationsService } from '@busmate/api-client-core';
import type {
  BusPassengerServicePermitAssignmentResponse,
  BusResponse,
  PassengerServicePermitResponse,
} from '@busmate/api-client-core';
import { useParams } from '@/lib/router';
import { useMyOperator } from '@/hooks/operator/useMyOperator';
import { apiErrorMessage } from '@/lib/api/errors';

/** One of the operator's own permits, its bus links and the operator's buses (INC-017). */
export function usePermitDetail() {
  const { permitId } = useParams() as { permitId: string };
  const { operator } = useMyOperator();
  const [permit, setPermit] = useState<PassengerServicePermitResponse | null>(null);
  const [links, setLinks] = useState<BusPassengerServicePermitAssignmentResponse[]>([]);
  const [buses, setBuses] = useState<BusResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!operator?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [p, l, b] = await Promise.all([
        BusOperatorOperationsService.getOperatorPermitById(operator.id, permitId),
        BusOperatorOperationsService.getOperatorPermitBuses(operator.id, permitId),
        BusOperatorOperationsService.getOperatorBuses(operator.id, 0, 100, 'plateNumber', 'asc'),
      ]);
      setPermit(p);
      setLinks(l);
      setBuses(b.content ?? []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load the permit'));
    } finally {
      setIsLoading(false);
    }
  }, [operator?.id, permitId]);

  useEffect(() => {
    load();
  }, [load]);

  const run = useCallback(async (action: () => Promise<unknown>, fallback: string) => {
    setBusy(true);
    setActionError(null);
    try {
      await action();
      await load();
      return true;
    } catch (err) {
      setActionError(apiErrorMessage(err, fallback));
      return false;
    } finally {
      setBusy(false);
    }
  }, [load]);

  const linkBus = (busId: string, startDate: string) =>
    operator?.id && run(() => BusOperatorOperationsService.linkBusToOperatorPermit(operator.id!, permitId, { busId, startDate }), 'Could not link the bus');

  const endLink = (linkId: string) =>
    operator?.id && run(() => BusOperatorOperationsService.endOperatorPermitBusLink(operator.id!, permitId, linkId), 'Could not end the link');

  const withdraw = (reason: string) =>
    operator?.id ? run(() => BusOperatorOperationsService.withdrawOperatorPermit(operator.id!, permitId, { reason }), 'Could not withdraw the permit') : Promise.resolve(false);

  return { permitId, permit, links, buses, isLoading, error, actionError, setActionError, busy, reload: load, linkBus, endLink, withdraw };
}
