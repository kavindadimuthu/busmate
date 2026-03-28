import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePageContext } from '@/context/PageContext';
import { getOperatorTripById } from '@/data/operator/trips';
import type { OperatorTrip } from '@/data/operator/trips';

export function useTripDetail() {
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

  const handleBack = useCallback(() => {
    router.push('/operator/trips');
  }, [router]);

  return { trip, isLoading, error, handleBack };
}
