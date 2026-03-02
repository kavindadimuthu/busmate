/**
 * Centralized Google Maps loader hook
 * This hook ensures Google Maps API is loaded only once across the entire application
 * Use this hook in all components that need Google Maps functionality
 */

import { useLoadScript } from '@react-google-maps/api';
import { useMemo } from 'react';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Define libraries as a constant to prevent re-renders
const LIBRARIES: ("places" | "geometry" | "drawing" | "visualization")[] = ['places', 'geometry'];

export function useGoogleMaps() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const result = useMemo(() => ({
    isLoaded,
    loadError,
    isReady: isLoaded && !loadError,
  }), [isLoaded, loadError]);

  return result;
}
