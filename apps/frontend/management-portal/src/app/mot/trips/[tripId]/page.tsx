'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { TripOverview } from '@/components/mot/trip-details/TripOverview';
import { TripTabsSection } from '@/components/mot/trip-details/TripTabsSection';
import { TripManagementService } from '../../../../../generated/api-clients/route-management/services/TripManagementService';
import { RouteManagementService } from '../../../../../generated/api-clients/route-management/services/RouteManagementService';
import { ScheduleManagementService } from '../../../../../generated/api-clients/route-management/services/ScheduleManagementService';
import { PermitManagementService } from '../../../../../generated/api-clients/route-management/services/PermitManagementService';
import type { TripResponse } from '../../../../../generated/api-clients/route-management/models/TripResponse';
import type { RouteResponse } from '../../../../../generated/api-clients/route-management/models/RouteResponse';
import type { ScheduleResponse } from '../../../../../generated/api-clients/route-management/models/ScheduleResponse';
import type { PassengerServicePermitResponse } from '../../../../../generated/api-clients/route-management/models/PassengerServicePermitResponse';
import { 
  ArrowLeft, 
  RefreshCw, 
  Edit2, 
  Trash2, 
  Play, 
  Square, 
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TripDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.tripId as string;

  // State
  const [trip, setTrip] = useState<TripResponse | null>(null);
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
  const [permit, setPermit] = useState<PassengerServicePermitResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Load trip details and related data
  const loadTripDetails = useCallback(async () => {
    if (!tripId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Load trip details
      const tripResponse = await TripManagementService.getTripById(tripId);
      setTrip(tripResponse);

      // Load related route if available
      if (tripResponse.routeId) {
        try {
          const routeResponse = await RouteManagementService.getRouteById(tripResponse.routeId);
          setRoute(routeResponse);
        } catch (routeError) {
          console.warn('Failed to load route details:', routeError);
        }
      }

      // Load related schedule if available
      if (tripResponse.scheduleId) {
        try {
          const scheduleResponse = await ScheduleManagementService.getScheduleById(tripResponse.scheduleId);
          setSchedule(scheduleResponse);
        } catch (scheduleError) {
          console.warn('Failed to load schedule details:', scheduleError);
        }
      }

      // Load related permit if available
      if (tripResponse.passengerServicePermitId) {
        try {
          const permitResponse = await PermitManagementService.getPermitById(tripResponse.passengerServicePermitId);
          setPermit(permitResponse);
        } catch (permitError) {
          console.warn('Failed to load permit details:', permitError);
        }
      }

    } catch (err) {
      console.error('Failed to load trip details:', err);
      setError('Failed to load trip details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadTripDetails();
  }, [loadTripDetails]);

  // Trip status helper functions
  const canStart = (status?: string) => {
    return status === 'pending';
  };

  const canComplete = (status?: string) => {
    return status === 'active' || status === 'in_transit' || status === 'departed';
  };

  const canCancel = (status?: string) => {
    return status === 'pending' || status === 'active' || status === 'delayed';
  };

  const canEdit = (status?: string) => {
    return status === 'pending' || status === 'active';
  };

  // Handlers
  const handleBack = () => {
    router.back();
  };

  const handleEdit = () => {
    router.push(`/mot/trips/${tripId}/edit`);
  };

  const handleRefresh = () => {
    loadTripDetails();
  };

  // Trip status action handlers
  const handleStart = async () => {
    if (!trip?.id) return;

    try {
      await TripManagementService.startTrip(trip.id);
      await loadTripDetails(); // Refresh data
    } catch (error) {
      console.error('Failed to start trip:', error);
    }
  };

  const handleComplete = async () => {
    if (!trip?.id) return;

    try {
      await TripManagementService.completeTrip(trip.id);
      await loadTripDetails(); // Refresh data
    } catch (error) {
      console.error('Failed to complete trip:', error);
    }
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async (reason?: string) => {
    if (!trip?.id) return;

    try {
      setIsCancelling(true);
      await TripManagementService.cancelTrip(trip.id, reason || 'No reason provided');
      await loadTripDetails(); // Refresh data
      setShowCancelModal(false);
    } catch (error) {
      console.error('Failed to cancel trip:', error);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const handleDeleteConfirm = async () => {
    if (!trip?.id) return;

    try {
      setIsDeleting(true);
      await TripManagementService.deleteTrip(trip.id);
      router.push('/mot/trips');
    } catch (error) {
      console.error('Failed to delete trip:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  useSetPageMetadata({
    title: trip ? `Trip Details - ${trip.routeName || 'Unknown Route'}` : 'Trip Details',
    description: trip ? `${trip.tripDate ? new Date(trip.tripDate).toLocaleDateString() : 'No Date'} - ${trip.scheduledDepartureTime || 'No Time'}` : 'Loading trip details...',
    activeItem: 'trips',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Trips', href: '/mot/trips' }, { label: 'Trip Details' }],
  });

  useSetPageActions(
    <div className="flex items-center space-x-2">
      <Button variant="outline" onClick={handleBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      <Button variant="outline" size="sm" onClick={handleRefresh}>
        <RefreshCw className="h-4 w-4" />
      </Button>
      {trip && canStart(trip.status) && (
        <Button size="sm" onClick={handleStart}>
          <Play className="h-4 w-4 mr-2" />
          Start Trip
        </Button>
      )}
      {trip && canComplete(trip.status) && (
        <Button size="sm" onClick={handleComplete}>
          <CheckCircle className="h-4 w-4 mr-2" />
          Complete Trip
        </Button>
      )}
      {trip && canCancel(trip.status) && (
        <Button variant="outline" size="sm" onClick={handleCancel}>
          <Square className="h-4 w-4 mr-2" />
          Cancel Trip
        </Button>
      )}
      {trip && canEdit(trip.status) && (
        <Button variant="outline" size="sm" onClick={handleEdit}>
          <Edit2 className="h-4 w-4 mr-2" />
          Edit
        </Button>
      )}
      {trip && (
        <Button variant="outline" size="sm" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      )}
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-lg text-gray-600">Loading trip details...</span>
          </div>
    );
  }

  // Error state
  if (error || !trip) {
    return (
          <div className="text-center py-12">
            <XCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {error || 'Trip not found'}
            </h3>
            <p className="text-gray-500 mb-6">
              The requested trip could not be loaded. Please check the trip ID and try again.
            </p>
            <div className="flex justify-center space-x-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
    );
  }

  return (
    <>
        <div className="space-y-6">
          {/* Trip Overview */}
          <TripOverview 
            trip={trip} 
            route={route} 
            schedule={schedule}
            permit={permit}
          />

          {/* Trip Tabs */}
          <TripTabsSection 
            trip={trip}
            route={route}
            schedule={schedule}
            permit={permit}
            onRefresh={loadTripDetails}
          />
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={handleDeleteCancel} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex items-center mb-4">
                  <XCircle className="h-6 w-6 text-red-600 mr-3" />
                  <h3 className="text-lg font-medium text-gray-900">Confirm Delete</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this trip? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={handleDeleteCancel}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteConfirm}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Trip'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Cancel Trip Modal */}
        {showCancelModal && (
          <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowCancelModal(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex items-center mb-4">
                  <AlertCircle className="h-6 w-6 text-yellow-600 mr-3" />
                  <h3 className="text-lg font-medium text-gray-900">Cancel Trip</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to cancel this trip?
                </p>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cancellation Reason (Optional)
                  </label>
                  <textarea 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter reason for cancellation..."
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setShowCancelModal(false)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => handleCancelConfirm()}
                    disabled={isCancelling}
                  >
                    {isCancelling ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      'Cancel Trip'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
    </>
  );
}
