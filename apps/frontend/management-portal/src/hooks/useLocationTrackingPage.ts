import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import type { TrackedBus, MapViewMode } from '@/types/location-tracking';

export function useLocationTrackingPage() {
  const router = useRouter();
  const { isLoaded } = useGoogleMaps();
  const tracking = useLocationTracking();

  const [searchTerm, setSearchTerm] = useState(tracking.filters.search);
  const [busListCollapsed, setBusListCollapsed] = useState(false);

  const handleViewBusDetails = useCallback((bus: TrackedBus) => {
    console.log('View details for bus:', bus.bus.registrationNumber);
  }, []);

  const handleViewRoute = useCallback(
    (routeId: string) => {
      router.push(`/mot/routes/${routeId}`);
    },
    [router]
  );

  const handleViewModeChange = useCallback(
    (mode: MapViewMode) => {
      tracking.setViewMode(mode);
      if (mode === 'fullscreen') {
        tracking.setStatsCollapsed(true);
      }
    },
    [tracking.setViewMode, tracking.setStatsCollapsed]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
      tracking.setFilters({ ...tracking.filters, search: value });
    },
    [tracking.filters, tracking.setFilters]
  );

  const handleClearAllFilters = useCallback(() => {
    setSearchTerm('');
    tracking.setFilters({
      search: '',
      routeId: 'all',
      operatorId: 'all',
      tripStatus: 'all',
      deviceStatus: 'all',
      movementStatus: 'all',
      showOnlyActive: false,
      showOfflineDevices: true,
    });
  }, [tracking.setFilters]);

  const activeFilterCount = useMemo(() => {
    const { routeId, operatorId, tripStatus, deviceStatus, movementStatus } =
      tracking.filters;
    return [routeId, operatorId, tripStatus, deviceStatus, movementStatus].filter(
      (v) => v !== 'all'
    ).length;
  }, [tracking.filters]);

  return {
    ...tracking,
    isLoaded,
    searchTerm,
    busListCollapsed,
    setBusListCollapsed,
    handleViewBusDetails,
    handleViewRoute,
    handleViewModeChange,
    handleSearchChange,
    handleClearAllFilters,
    activeFilterCount,
  };
}

export type LocationTrackingPageState = ReturnType<typeof useLocationTrackingPage>;
