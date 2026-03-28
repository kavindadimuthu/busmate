'use client';

import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { TripOverview } from '@/components/mot/trip-details/TripOverview';
import { TripTabsSection } from '@/components/mot/trip-details/TripTabsSection';
import { useTripDetails } from '@/hooks/mot/trip-details/useTripDetails';
import { TripDetailsActions } from '@/components/mot/trip-details/TripDetailsActions';
import { TripDetailsModals } from '@/components/mot/trip-details/TripDetailsModals';
import { RefreshCw, XCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@busmate/ui';

export default function TripDetailsPage() {
  const details = useTripDetails();
  const { trip, route, schedule, permit, isLoading, error } = details;

  useSetPageMetadata({
    title: trip ? `Trip Details - ${trip.routeName || 'Unknown Route'}` : 'Trip Details',
    description: trip
      ? `${trip.tripDate ? new Date(trip.tripDate).toLocaleDateString() : 'No Date'} - ${trip.scheduledDepartureTime || 'No Time'}`
      : 'Loading trip details...',
    activeItem: 'trips',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Trips', href: '/mot/trips' }, { label: 'Trip Details' }],
  });

  useSetPageActions(
    <TripDetailsActions
      trip={trip}
      canStart={details.canStart}
      canComplete={details.canComplete}
      canCancel={details.canCancel}
      canEdit={details.canEdit}
      onBack={details.handleBack}
      onRefresh={details.handleRefresh}
      onStart={details.handleStart}
      onComplete={details.handleComplete}
      onCancel={details.handleCancel}
      onEdit={details.handleEdit}
      onDelete={details.handleDelete}
    />
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg text-muted-foreground">Loading trip details...</span>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="text-center py-12">
        <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">{error || 'Trip not found'}</h3>
        <p className="text-muted-foreground mb-6">
          The requested trip could not be loaded. Please check the trip ID and try again.
        </p>
        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={details.handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />Go Back
          </Button>
          <Button onClick={details.handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <TripOverview trip={trip} route={route} schedule={schedule} permit={permit} />
        <TripTabsSection trip={trip} route={route} schedule={schedule} permit={permit} onRefresh={details.loadTripDetails} />
      </div>
      <TripDetailsModals
        showDeleteModal={details.showDeleteModal}
        showCancelModal={details.showCancelModal}
        isDeleting={details.isDeleting}
        isCancelling={details.isCancelling}
        onDeleteCancel={details.handleDeleteCancel}
        onDeleteConfirm={details.handleDeleteConfirm}
        onCancelConfirm={details.handleCancelConfirm}
        onCancelModalClose={() => details.setShowCancelModal(false)}
      />
    </>
  );
}
