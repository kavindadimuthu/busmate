import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { ScheduleDetailsActions } from '@/components/mot/schedules/ScheduleDetailsActions';
import {
  ScheduleManagementService,
  RouteManagementService,
  TripManagementService,
  ScheduleResponse,
  RouteResponse,
  TripResponse,
} from '@busmate/api-client-route';
import { toast } from 'sonner';

export function useScheduleDetails() {
  const router = useRouter();
  const params = useParams();
  const scheduleId = params.scheduleId as string;

  // State
  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [trips, setTrips] = useState<TripResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  // ── Data loading ──────────────────────────────────────────

  const loadScheduleDetails = useCallback(async () => {
    if (!scheduleId) return;
    try {
      setIsLoading(true);
      setError(null);
      const scheduleData = await ScheduleManagementService.getScheduleById(scheduleId);
      setSchedule(scheduleData);

      if (scheduleData.routeId) {
        try {
          const routeData = await RouteManagementService.getRouteById(scheduleData.routeId);
          setRoute(routeData);
        } catch (routeError) {
          console.error('Error loading route details:', routeError);
        }
      }
    } catch (err) {
      console.error('Error loading schedule details:', err);
      setError('Failed to load schedule details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [scheduleId]);

  const loadScheduleTrips = useCallback(async () => {
    if (!scheduleId) return;
    try {
      setTripsLoading(true);
      const tripsData = await TripManagementService.getTripsBySchedule(scheduleId);
      setTrips(tripsData || []);
    } catch (err) {
      console.error('Error loading schedule trips:', err);
    } finally {
      setTripsLoading(false);
    }
  }, [scheduleId]);

  useEffect(() => {
    loadScheduleDetails();
    loadScheduleTrips();
  }, [loadScheduleDetails, loadScheduleTrips]);

  // ── Handlers ──────────────────────────────────────────────

  const handleEdit = useCallback(() => {
    if (schedule?.routeId) {
      router.push(`/mot/schedules/workspace?routeId=${schedule.routeId}&scheduleId=${scheduleId}`);
    }
  }, [schedule, router, scheduleId]);

  const handleClone = useCallback(() => {
    router.push(`/mot/schedules/${scheduleId}/clone`);
  }, [router, scheduleId]);

  const handleGenerateTrips = useCallback(() => {
    router.push(`/mot/schedules/${scheduleId}/generate-trips`);
  }, [router, scheduleId]);

  const handleAssignBuses = useCallback(() => {
    router.push(`/mot/schedules/${scheduleId}/assign-buses`);
  }, [router, scheduleId]);

  const handleBack = useCallback(() => {
    router.push('/mot/schedules');
  }, [router]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([loadScheduleDetails(), loadScheduleTrips()]);
  }, [loadScheduleDetails, loadScheduleTrips]);

  // Delete
  const handleDelete = useCallback(() => setShowDeleteModal(true), []);
  const handleDeleteCancel = useCallback(() => setShowDeleteModal(false), []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!schedule?.id) return;
    try {
      setIsDeleting(true);
      await ScheduleManagementService.deleteSchedule(schedule.id);
      toast.success(`Schedule "${schedule.name}" has been deleted successfully`);
      router.push('/mot/schedules');
    } catch (err) {
      console.error('Error deleting schedule:', err);
      toast.error('Failed to delete schedule. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  }, [schedule, router]);

  // Deactivate
  const handleDeactivate = useCallback(() => setShowDeactivateModal(true), []);
  const handleDeactivateCancel = useCallback(() => setShowDeactivateModal(false), []);

  const handleDeactivateConfirm = useCallback(async () => {
    if (!schedule?.id) return;
    try {
      setIsDeactivating(true);
      await ScheduleManagementService.deactivateSchedule(schedule.id);
      toast.success(`Schedule "${schedule.name}" has been deactivated`);
      await loadScheduleDetails();
    } catch (err) {
      console.error('Error deactivating schedule:', err);
      toast.error('Failed to deactivate schedule. Please try again.');
    } finally {
      setIsDeactivating(false);
      setShowDeactivateModal(false);
    }
  }, [schedule, loadScheduleDetails]);

  // Activate
  const handleActivate = useCallback(async () => {
    if (!schedule?.id) return;
    try {
      await ScheduleManagementService.activateSchedule(schedule.id);
      toast.success(`Schedule "${schedule.name}" has been activated`);
      await loadScheduleDetails();
    } catch (err) {
      console.error('Error activating schedule:', err);
      toast.error('Failed to activate schedule. Please try again.');
    }
  }, [schedule, loadScheduleDetails]);

  // ── Page metadata & actions ───────────────────────────────

  useSetPageMetadata({
    title: `Schedule: ${schedule?.name || 'Details'}`,
    description: 'Manage schedule details and trips',
    activeItem: 'schedules',
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Schedules', href: '/mot/schedules' },
      { label: schedule?.name || 'Schedule Details' },
    ],
  });

  useSetPageActions(
    React.createElement(ScheduleDetailsActions, {
      status: schedule?.status,
      onRefresh: handleRefresh,
      onClone: handleClone,
      onDeactivate: handleDeactivate,
      onActivate: handleActivate,
      onEdit: handleEdit,
      onDelete: handleDelete,
    })
  );

  return {
    schedule,
    route,
    trips,
    isLoading,
    tripsLoading,
    error,
    showDeleteModal,
    showDeactivateModal,
    isDeleting,
    isDeactivating,
    handleBack,
    handleRefresh,
    handleGenerateTrips,
    handleAssignBuses,
    handleDeleteCancel,
    handleDeleteConfirm,
    handleDeactivateCancel,
    handleDeactivateConfirm,
  };
}
