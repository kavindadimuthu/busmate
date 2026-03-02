'use client';

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { useJsApiLoader } from '@react-google-maps/api';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';

// Page Context
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';

// Custom Hook
import { useLocationTracking } from '@/hooks/useLocationTracking';

// Components
import {
  TrackingStatsCards,
  TrackingMap,
  TrackingBusList,
  LocationTrackingAdvancedFilters,
  LocationTrackingActionButtons,
} from '@/components/mot/location-tracking';

// Types
import type { TrackedBus, MapViewMode } from '@/types/location-tracking';

// ── Google Maps Libraries ─────────────────────────────────────────

const GOOGLE_MAPS_LIBRARIES: ('geometry' | 'places')[] = ['geometry', 'places'];

// ── Main Page Component ───────────────────────────────────────────

export default function LocationTrackingPage() {
  const router = useRouter();

  // Set page metadata
  useSetPageMetadata({
    title: 'Location Tracking',
    description: 'Real-time bus location monitoring and fleet tracking',
    activeItem: 'location-tracking',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Location Tracking' }],
  });

  // Load Google Maps API
  const { isLoaded } = useGoogleMaps();

  // Use custom hook for all state management
  const {
    buses,
    filteredBuses,
    statsMetrics,
    filterOptions,
    filters,
    setFilters,
    selectedBus,
    setSelectedBus,
    mapCenter,
    setMapCenter,
    mapZoom,
    setMapZoom,
    viewMode,
    setViewMode,
    statsCollapsed,
    setStatsCollapsed,
    isLoading,
    error,
    refresh,
    lastUpdate,
    autoRefresh,
    setAutoRefresh,
    refreshInterval,
    setRefreshInterval,
    focusOnBus,
  } = useLocationTracking();

  // Handle view bus details
  const handleViewBusDetails = useCallback(
    (bus: TrackedBus) => {
      // Navigate to a detailed bus view page (if exists)
      // For now, just log or show a toast
      console.log('View details for bus:', bus.bus.registrationNumber);
    },
    []
  );

  // Handle view route
  const handleViewRoute = useCallback(
    (routeId: string) => {
      // Navigate to route details page
      router.push(`/mot/routes/${routeId}`);
    },
    [router]
  );

  // Handle view mode changes
  const handleViewModeChange = useCallback(
    (mode: MapViewMode) => {
      setViewMode(mode);
      // Collapse stats when going fullscreen
      if (mode === 'fullscreen') {
        setStatsCollapsed(true);
      }
    },
    [setViewMode, setStatsCollapsed]
  );

  // Search term state (managed locally, synced to filters on change)
  const [searchTerm, setSearchTerm] = useState(filters.search);

  // Bus list collapsed state
  const [busListCollapsed, setBusListCollapsed] = useState(false);

  // Handle search change
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
      setFilters({ ...filters, search: value });
    },
    [filters, setFilters]
  );

  // Handle clear all filters
  const handleClearAllFilters = useCallback(() => {
    setSearchTerm('');
    setFilters({
      search: '',
      routeId: 'all',
      operatorId: 'all',
      tripStatus: 'all',
      deviceStatus: 'all',
      movementStatus: 'all',
      showOnlyActive: false,
      showOfflineDevices: true,
    });
  }, [setFilters]);

  // Set page actions using the new shared component
  useSetPageActions(
    <LocationTrackingActionButtons
      autoRefresh={autoRefresh}
      onAutoRefreshToggle={() => setAutoRefresh(!autoRefresh)}
      onRefresh={refresh}
      isLoading={isLoading}
      viewMode={viewMode}
      onViewModeChange={handleViewModeChange}
      lastUpdate={lastUpdate}
    />
  );

  // Fullscreen view - only show map
  if (viewMode === 'fullscreen') {
    if (!isLoaded) {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-gray-50">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-50 bg-white">
        <TrackingMap
          buses={filteredBuses}
          selectedBus={selectedBus}
          onBusSelect={setSelectedBus}
          center={mapCenter}
          zoom={mapZoom}
          onCenterChange={setMapCenter}
          onZoomChange={setMapZoom}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          isLoaded={isLoaded}
          isLoading={isLoading}
          onViewBusDetails={handleViewBusDetails}
          onViewRoute={handleViewRoute}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-4 overflow-hidden">
      {/* Stats Cards - Collapsible */}
      <div className="flex-none">
        <TrackingStatsCards
          metrics={statsMetrics}
          loading={isLoading && statsMetrics.length === 0}
          isCollapsed={statsCollapsed}
          onToggleCollapse={() => setStatsCollapsed(!statsCollapsed)}
          lastUpdate={lastUpdate}
        />
      </div>

      {/* Search & Filters */}
      <div className="flex-none">
        <LocationTrackingAdvancedFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filters={filters}
          onFiltersChange={setFilters}
          filterOptions={filterOptions}
          loading={isLoading}
          totalCount={buses.length}
          filteredCount={filteredBuses.length}
          loadedCount={filteredBuses.length}
          onClearAll={handleClearAllFilters}
          onSearch={handleSearchChange}
        />
      </div>

      {/* Main Content: Map + Bus List */}
      <div className="flex-1 min-h-[300px] flex flex-col lg:flex-row gap-4 overflow-hidden">
        {/* Map - Takes available space */}
        <div className="flex-1 min-w-0 transition-all duration-300">
          <TrackingMap
            buses={filteredBuses}
            selectedBus={selectedBus}
            onBusSelect={setSelectedBus}
            center={mapCenter}
            zoom={mapZoom}
            onCenterChange={setMapCenter}
            onZoomChange={setMapZoom}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            isLoaded={isLoaded}
            isLoading={isLoading}
            onViewBusDetails={handleViewBusDetails}
            onViewRoute={handleViewRoute}
          />
        </div>

        {/* Bus List Sidebar - Collapsible to the right */}
        <div
          className={`transition-all duration-300 ease-in-out shrink-0 ${busListCollapsed ? 'w-full lg:w-16' : 'w-full lg:w-96'
            } flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-full`}
        >
          <TrackingBusList
            buses={filteredBuses}
            selectedBus={selectedBus}
            onBusSelect={setSelectedBus}
            onBusFocus={focusOnBus}
            isLoading={isLoading}
            error={error}
            isCollapsed={busListCollapsed}
            onToggleCollapse={() => setBusListCollapsed(!busListCollapsed)}
          />
        </div>
      </div>
    </div>
  );
}
