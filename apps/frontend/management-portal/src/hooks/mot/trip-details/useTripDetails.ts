'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  TripManagementService,
  RouteManagementService,
  ScheduleManagementService,
  PermitManagementService,
} from '@busmate/api-client-route';
import type {
  TripResponse,
  RouteResponse,
  ScheduleResponse,
  PassengerServicePermitResponse,
} from '@busmate/api-client-route';

export function useTripDetails() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.tripId as string;

  const [trip, setTrip] = useState<TripResponse | null>(null);
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
  const [permit, setPermit] = useState<PassengerServicePermitResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadTripDetails = useCallback(async () => {
    if (!tripId) return;
    try {
      setIsLoading(true);
      setError(null);

      const tripResponse = await TripManagementService.getTripById(tripId);
      setTrip(tripResponse);

      if (tripResponse.routeId) {
        try {
          const routeResponse = await RouteManagementService.getRouteById(tripResponse.routeId);
          setRoute(routeResponse);
        } catch (e) { console.warn('Failed to load route details:', e); }
      }
      if (tripResponse.scheduleId) {
        try {
          const scheduleResponse = await ScheduleManagementService.getScheduleById(tripResponse.scheduleId);
          setSchedule(scheduleResponse);
        } catch (e) { console.warn('Failed to load schedule details:', e); }
      }
      if (tripResponse.passengerServicePermitId) {
        try {
          const permitResponse = await PermitManagementService.getPermitById(tripResponse.passengerServicePermitId);
          setPermit(permitResponse);
        } catch (e) { console.warn('Failed to load permit details:', e); }
      }
    } catch (err) {
      console.error('Failed to load trip details:', err);
      setError('Failed to load trip details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  useEffect(() => { loadTripDetails(); }, [loadTripDetails]);

  const canStart = (status?: string) => status === 'pending';
  const canComplete = (status?: string) =>
    status === 'active' || status === 'in_transit' || status === 'departed';
  const canCancel = (status?: string) =>
    status === 'pending' || status === 'active' || status === 'delayed';
  const canEdit = (status?: string) => status === 'pending' || status === 'active';

  const handleBack = () => router.back();
  const handleEdit = () => router.push(`/mot/trips/${tripId}/edit`);
  const handleRefresh = () => { loadTripDetails(); };

  const handleStart = async () => {
    if (!trip?.id) return;
    try {
      await TripManagementService.startTrip(trip.id);
      await loadTripDetails();
    } catch (e) { console.error('Failed to start trip:', e); }
  };

  const handleComplete = async () => {
    if (!trip?.id) return;
    try {
      await TripManagementService.completeTrip(trip.id);
      await loadTripDetails();
    } catch (e) { console.error('Failed to complete trip:', e); }
  };

  const handleCancel = () => setShowCancelModal(true);

  const handleCancelConfirm = async (reason?: string) => {
    if (!trip?.id) return;
    try {
      setIsCancelling(true);
      await TripManagementService.cancelTrip(trip.id, reason || 'No reason provided');
      await loadTripDetails();
      setShowCancelModal(false);
    } catch (e) { console.error('Failed to cancel trip:', e); }
    finally { setIsCancelling(false); }
  };

  const handleDelete = () => setShowDeleteModal(true);
  const handleDeleteCancel = () => setShowDeleteModal(false);

  const handleDeleteConfirm = async () => {
    if (!trip?.id) return;
    try {
      setIsDeleting(true);
      await TripManagementService.deleteTrip(trip.id);
      router.push('/mot/trips');
    } catch (e) { console.error('Failed to delete trip:', e); }
    finally { setIsDeleting(false); setShowDeleteModal(false); }
  };

  return {
    trip, route, schedule, permit,
    isLoading, error,
    showDeleteModal, showCancelModal, isDeleting, isCancelling,
    canStart, canComplete, canCancel, canEdit,
    handleBack, handleEdit, handleRefresh,
    handleStart, handleComplete, handleCancel, handleCancelConfirm,
    handleDelete, handleDeleteCancel, handleDeleteConfirm,
    setShowCancelModal,
    loadTripDetails,
  };
}
