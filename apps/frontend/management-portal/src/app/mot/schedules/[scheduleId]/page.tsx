'use client';

import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useScheduleDetails } from '@/components/mot/schedules/useScheduleDetails';
import { ScheduleOverview, ScheduleTabsSection } from '@/components/mot/schedule-details';
import {
  DeleteConfirmationModal,
  DeactivationConfirmationModal,
} from '@/components/mot/confirmation-modals';

export default function ScheduleDetailsPage() {
  const {
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
  } = useScheduleDetails();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !schedule) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive/80 mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Schedule Not Found</h3>
        <p className="text-muted-foreground mb-6">{error || 'The requested schedule could not be found.'}</p>
        <button
          onClick={handleBack}
          className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Schedules
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ScheduleOverview schedule={schedule} route={route} tripsCount={trips.length} />

      <ScheduleTabsSection
        schedule={schedule}
        route={route}
        trips={trips}
        tripsLoading={tripsLoading}
        onRefresh={handleRefresh}
        onGenerateTrips={handleGenerateTrips}
        onAssignBuses={handleAssignBuses}
      />

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