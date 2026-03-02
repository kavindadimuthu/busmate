'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Edit, 
  Plus, 
  Trash2, 
  AlertCircle,
  Power,
  Copy,
  Calendar,
  Clock,
  MapPin,
  Route,
  Activity,
  RefreshCw
} from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { ScheduleOverview, ScheduleTabsSection } from '@/components/mot/schedule-details';
import { 
  ScheduleManagementService,
  RouteManagementService,
  TripManagementService,
  ScheduleResponse, 
  RouteResponse,
  TripResponse
} from '../../../../../generated/api-clients/route-management';
import {
  DeleteConfirmationModal,
  DeactivationConfirmationModal,
} from '@/components/mot/confirmation-modals';
import { toast } from 'sonner';

export default function ScheduleDetailsPage() {
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

  // Load schedule details
  const loadScheduleDetails = useCallback(async () => {
    if (!scheduleId) return;

    try {
      setIsLoading(true);
      setError(null);

      const scheduleData = await ScheduleManagementService.getScheduleById(scheduleId);
      setSchedule(scheduleData);

      // Load route details if route ID exists
      if (scheduleData.routeId) {
        try {
          const routeData = await RouteManagementService.getRouteById(scheduleData.routeId);
          setRoute(routeData);
        } catch (routeError) {
          console.error('Error loading route details:', routeError);
          // Don't set main error for route failure
        }
      }

    } catch (err) {
      console.error('Error loading schedule details:', err);
      setError('Failed to load schedule details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [scheduleId]);

  // Load schedule trips
  const loadScheduleTrips = useCallback(async () => {
    if (!scheduleId) return;

    try {
      setTripsLoading(true);
      
      const tripsData = await TripManagementService.getTripsBySchedule(scheduleId);
      setTrips(tripsData || []);

    } catch (err) {
      console.error('Error loading schedule trips:', err);
      // Don't show error toast for trips - it's optional data
    } finally {
      setTripsLoading(false);
    }
  }, [scheduleId]);

  useEffect(() => {
    loadScheduleDetails();
    loadScheduleTrips();
  }, [loadScheduleDetails, loadScheduleTrips]);

  useSetPageMetadata({
    title: `Schedule: ${schedule?.name || 'Details'}`,
    description: 'Manage schedule details and trips',
    activeItem: 'schedules',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Schedules', href: '/mot/schedules' }, { label: schedule?.name || 'Schedule Details' }],
  });

  // Handlers
  const handleEdit = () => {
    router.push(`/mot/schedules/${scheduleId}/edit`);
  };

  const handleClone = () => {
    router.push(`/mot/schedules/${scheduleId}/clone`);
  };

  const handleGenerateTrips = () => {
    router.push(`/mot/schedules/${scheduleId}/generate-trips`);
  };

  const handleAssignBuses = () => {
    router.push(`/mot/schedules/${scheduleId}/assign-buses`);
  };

  // Delete modal handlers
  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const handleDeleteConfirm = async () => {
    if (!schedule?.id) return;

    try {
      setIsDeleting(true);
      await ScheduleManagementService.deleteSchedule(schedule.id);
      toast.success(`Schedule "${schedule.name}" has been deleted successfully`);
      router.push('/mot/schedules');
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Deactivate modal handlers
  const handleDeactivate = () => {
    setShowDeactivateModal(true);
  };

  const handleDeactivateCancel = () => {
    setShowDeactivateModal(false);
  };

  const handleDeactivateConfirm = async () => {
    if (!schedule?.id) return;

    try {
      setIsDeactivating(true);
      await ScheduleManagementService.deactivateSchedule(schedule.id);
      toast.success(`Schedule "${schedule.name}" has been deactivated`);
      // Refresh schedule data
      await loadScheduleDetails();
    } catch (error) {
      console.error('Error deactivating schedule:', error);
      toast.error('Failed to deactivate schedule. Please try again.');
    } finally {
      setIsDeactivating(false);
      setShowDeactivateModal(false);
    }
  };

  // Activate handler
  const handleActivate = async () => {
    if (!schedule?.id) return;

    try {
      await ScheduleManagementService.activateSchedule(schedule.id);
      toast.success(`Schedule "${schedule.name}" has been activated`);
      // Refresh schedule data
      await loadScheduleDetails();
    } catch (error) {
      console.error('Error activating schedule:', error);
      toast.error('Failed to activate schedule. Please try again.');
    }
  };

  const handleBack = () => {
    router.push('/mot/schedules');
  };

  const handleRefresh = async () => {
    await Promise.all([
      loadScheduleDetails(),
      loadScheduleTrips()
    ]);
  };

  useSetPageActions(
    <div className="flex flex-wrap gap-2">
      <button
        onClick={handleRefresh}
        className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Refresh
      </button>
      <button
        onClick={handleClone}
        className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
      >
        <Copy className="w-4 h-4 mr-2" />
        Clone
      </button>
      {schedule?.status === 'ACTIVE' ? (
        <button
          onClick={handleDeactivate}
          className="inline-flex items-center px-3 py-2 border border-orange-300 text-orange-700 rounded-md hover:bg-orange-50 text-sm"
        >
          <Power className="w-4 h-4 mr-2" />
          Deactivate
        </button>
      ) : (
        <button
          onClick={handleActivate}
          className="inline-flex items-center px-3 py-2 border border-green-300 text-green-700 rounded-md hover:bg-green-50 text-sm"
        >
          <Power className="w-4 h-4 mr-2" />
          Activate
        </button>
      )}
      <button
        onClick={handleEdit}
        className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
      >
        <Edit className="w-4 h-4 mr-2" />
        Edit
      </button>
      <button
        onClick={handleDelete}
        className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Delete
      </button>
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state
  if (error || !schedule) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Schedule Not Found</h3>
        <p className="text-gray-500 mb-6">{error || 'The requested schedule could not be found.'}</p>
        <button
          onClick={handleBack}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Schedules
        </button>
      </div>
    );
  }

  return (
      <div className="space-y-6">

        {/* Schedule Overview */}
        <ScheduleOverview 
          schedule={schedule} 
          route={route} 
          tripsCount={trips.length}
        />

        {/* Tabs Section with Schedule Details */}
        <ScheduleTabsSection 
          schedule={schedule}
          route={route} 
          trips={trips}
          tripsLoading={tripsLoading}
          onRefresh={handleRefresh}
          onGenerateTrips={handleGenerateTrips}
          onAssignBuses={handleAssignBuses}
        />

        {/* Confirmation Modals */}
        <DeactivationConfirmationModal
          isOpen={showDeactivateModal}
          onClose={handleDeactivateCancel}
          onConfirm={handleDeactivateConfirm}
          title="Deactivate Schedule"
          itemName={schedule.name || 'this schedule'}
          isLoading={isDeactivating}
        />

        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Delete Schedule"
          itemName={schedule.name || 'this schedule'}
          isLoading={isDeleting}
        />
      </div>
  );
}