/**
 * Centralized Google Maps loader hook (same shape as new-react-portal's, which already loads
 * this library elsewhere in the monorepo — kept as its own copy since passenger-web and the
 * portal are separate Vite apps with no shared runtime state).
 */
import { useLoadScript } from '@react-google-maps/api';
import { useMemo } from 'react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const LIBRARIES: ('places' | 'geometry')[] = ['places', 'geometry'];

export function useGoogleMaps() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  return useMemo(() => ({ isLoaded, loadError, isReady: isLoaded && !loadError }), [isLoaded, loadError]);
}
