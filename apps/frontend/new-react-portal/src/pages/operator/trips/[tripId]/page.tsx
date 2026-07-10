'use client';

import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { useSetPageMetadata } from '@/context/PageContext';
import { TripSummary, TripAssignmentPanel } from '@/components/operator/trips';
import { useTripDetail } from '@/hooks/operator/trips/useTripDetail';

export default function OperatorTripDetailPage() {
  useSetPageMetadata({
    title: 'Trip Details',
    description: 'Loading trip information…',
    activeItem: 'trips',
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Trips', href: '/operator/trips' },
      { label: 'Trip Details' },
    ],
    padding: 0,
  });

  const {
    trip, isLoading, error, handleBack,
    myBuses, myConductors, actionLoading,
    assignBus, removeBus, assignConductor, removeConductor,
  } = useTripDetail();

  if (isLoading) {
    return (
      <main className="flex-1 flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="w-10 h-10 animate-spin text-primary/80" />
          <p className="font-medium">Loading trip details…</p>
        </div>
      </main>
    );
  }

  if (error || !trip) {
    return (
      <main className="flex-1 p-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Trips
        </button>
        <div className="bg-card rounded-xl border border-destructive/20 shadow-sm p-10 flex flex-col items-center text-center gap-4 max-w-lg mx-auto mt-12">
          <div className="w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-destructive/80" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Trip Not Found</h2>
          <p className="text-sm text-muted-foreground">
            {error ?? 'The requested trip could not be loaded. It may have been removed or the ID is incorrect.'}
          </p>
          <button
            onClick={handleBack}
            className="mt-2 px-5 py-2 bg-primary hover:bg-primary text-white text-sm font-medium rounded-lg transition-colors"
          >
            Back to Trips
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 space-y-6">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Trips
      </button>
      <TripSummary trip={trip} />
      <TripAssignmentPanel
        trip={trip}
        myBuses={myBuses}
        myConductors={myConductors}
        actionLoading={actionLoading}
        onAssignBus={assignBus}
        onRemoveBus={removeBus}
        onAssignConductor={assignConductor}
        onRemoveConductor={removeConductor}
      />
    </main>
  );
}
