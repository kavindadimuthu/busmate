'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from '@/lib/router';
import { toast } from 'sonner';
import { usePageContext } from '@/context/PageContext';
import { BusOperatorOperationsService, ApiError } from '@busmate/api-client-route';
import type { TripResponse, BusResponse } from '@busmate/api-client-route';
import { useMyOperator } from '@/hooks/operator/useMyOperator';
import { listUsers } from '@/lib/api/adminUsers';
import { toAdminUser } from '@/data/admin/users';
import type { AdminUser } from '@/data/admin/users';

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const body = err.body as { message?: string } | undefined;
    return body?.message ?? fallback;
  }
  return fallback;
}

export function useTripDetail() {
  const { setMetadata } = usePageContext();
  const params = useParams();
  const router = useRouter();
  const tripId = params?.tripId as string;
  const { operator, isLoading: operatorLoading, error: operatorError } = useMyOperator();

  const [trip, setTrip] = useState<TripResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // For the assignment pickers - the operator's own buses and conductors only.
  const [myBuses, setMyBuses] = useState<BusResponse[]>([]);
  const [myConductors, setMyConductors] = useState<AdminUser[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const loadTrip = useCallback(async () => {
    if (!operator?.id || !tripId) return;
    setIsLoading(true);
    setError(null);
    try {
      const found = await BusOperatorOperationsService.getOperatorTripById(operator.id, tripId);
      setTrip(found);
    } catch (err) {
      console.error('Error loading trip:', err);
      setError(errorMessage(err, `Trip "${tripId}" was not found.`));
    } finally {
      setIsLoading(false);
    }
  }, [operator?.id, tripId]);

  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  const loadAssignmentOptions = useCallback(async () => {
    if (!operator?.id) return;
    try {
      const [busesResult, conductorsPage] = await Promise.all([
        BusOperatorOperationsService.getOperatorBuses(operator.id, 0, 100, 'ntcRegistrationNumber', 'asc', 'active'),
        listUsers({ userType: 'conductor', size: 200 }),
      ]);
      setMyBuses(busesResult.content ?? []);
      const mine = (conductorsPage.content ?? [])
        .map(toAdminUser)
        .filter((c) => c.profileData?.assign_operator_id === operator.id && c.status === 'active');
      setMyConductors(mine);
    } catch (err) {
      console.error('Error loading assignment options:', err);
    }
  }, [operator?.id]);

  useEffect(() => {
    loadAssignmentOptions();
  }, [loadAssignmentOptions]);

  useEffect(() => {
    if (trip) {
      setMetadata({
        title: `Trip ${trip.tripDate ?? ''}`,
        description: `${trip.routeName ?? 'Route details'} — ${trip.tripDate ?? ''}`,
        breadcrumbs: [
          { label: 'Trips', href: '/operator/trips' },
          { label: trip.tripDate ?? 'Trip Details' },
        ],
      });
    }
  }, [trip, setMetadata]);

  const handleBack = useCallback(() => {
    router.push('/operator/trips');
  }, [router]);

  const assignBus = useCallback(async (busId: string) => {
    if (!operator?.id || !tripId) return;
    setActionLoading(true);
    try {
      const updated = await BusOperatorOperationsService.assignBusToTrip(operator.id, tripId, busId);
      setTrip(updated);
      toast.success('Vehicle assigned to trip.');
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to assign vehicle.'));
    } finally {
      setActionLoading(false);
    }
  }, [operator?.id, tripId]);

  const removeBus = useCallback(async () => {
    if (!operator?.id || !tripId) return;
    setActionLoading(true);
    try {
      const updated = await BusOperatorOperationsService.removeBusFromTrip(operator.id, tripId);
      setTrip(updated);
      toast.success('Vehicle unassigned from trip.');
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to unassign vehicle.'));
    } finally {
      setActionLoading(false);
    }
  }, [operator?.id, tripId]);

  const assignConductor = useCallback(async (conductorId: string) => {
    if (!operator?.id || !tripId) return;
    setActionLoading(true);
    try {
      const updated = await BusOperatorOperationsService.assignConductorToTrip(operator.id, tripId, conductorId);
      setTrip(updated);
      toast.success('Conductor assigned to trip.');
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to assign conductor.'));
    } finally {
      setActionLoading(false);
    }
  }, [operator?.id, tripId]);

  const removeConductor = useCallback(async () => {
    if (!operator?.id || !tripId) return;
    setActionLoading(true);
    try {
      const updated = await BusOperatorOperationsService.removeConductorFromTrip(operator.id, tripId);
      setTrip(updated);
      toast.success('Conductor unassigned from trip.');
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to unassign conductor.'));
    } finally {
      setActionLoading(false);
    }
  }, [operator?.id, tripId]);

  return {
    trip,
    isLoading: isLoading || operatorLoading,
    error: error ?? operatorError,
    handleBack,
    myBuses,
    myConductors,
    actionLoading,
    assignBus,
    removeBus,
    assignConductor,
    removeConductor,
  };
}
