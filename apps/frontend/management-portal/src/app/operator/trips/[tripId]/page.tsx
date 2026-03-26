'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { useSetPageMetadata, usePageContext } from '@/context/PageContext';
import { TripOverviewCard, TripTabsSection } from '@/components/operator/trips/trip-details';
import { getOperatorTripById } from '@/data/operator/trips';
import type { OperatorTrip } from '@/data/operator/trips';

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

  const { setMetadata } = usePageContext();
  const params = useParams();
  const router = useRouter();
  const tripId = params?.tripId as string;

  const [trip, setTrip] = useState<OperatorTrip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTrip = useCallback(() => {
    if (!tripId) {
      setError('No trip ID provided.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Simulate async (swap with real API call here)
    const timer = setTimeout(() => {
      const found = getOperatorTripById(tripId);
      if (found) {
        setTrip(found);
      } else {
        setError(`Trip "${tripId}" was not found.`);
      }
      setIsLoading(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [tripId]);

  useEffect(() => {
    const cleanup = loadTrip();
    return cleanup;
  }, [loadTrip]);

  // Update header when trip data is loaded
  useEffect(() => {
    if (trip) {
      setMetadata({
        title: `Trip ${trip.tripNumber}`,
        description: `${trip.route?.name ?? 'Route details'} — ${trip.tripDate}`,
        breadcrumbs: [
          { label: 'Trips', href: '/operator/trips' },
          { label: `Trip ${trip.tripNumber}` },
        ],
      });
    }
  }, [trip, setMetadata]);

  const handleBack = () => {
    router.push('/operator/trips');
  };

  // ── Loading ──────────────────────────────────────────────────────────────
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

  // ── Error / Not Found ────────────────────────────────────────────────────
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

  // ── Trip detail ──────────────────────────────────────────────────────────
  return (
    <main className="flex-1 p-6 space-y-6">
        {/* Read-only notice */}
        <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 text-sm text-primary">
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            This is a read-only view. Trip details are managed by your Motor Traffic authority.
          </span>
        </div>

        {/* Overview hero card */}
        <TripOverviewCard trip={trip} />

        {/* Detail tabs: Route, Schedule, Assignments, Status */}
        <TripTabsSection
          trip={trip}
          route={trip.route ?? null}
          schedule={trip.schedule ?? null}
          bus={trip.bus ?? null}
          staff={trip.staff ?? null}
          permit={trip.permit ?? null}
        />
    </main>
  );
}
