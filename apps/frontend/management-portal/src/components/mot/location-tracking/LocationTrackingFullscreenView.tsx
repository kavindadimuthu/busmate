'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { TrackingMap } from '@/components/mot/location-tracking';
import type { LocationTrackingPageState } from '@/hooks/useLocationTrackingPage';

interface LocationTrackingFullscreenViewProps {
  state: LocationTrackingPageState;
}

export function LocationTrackingFullscreenView({
  state,
}: LocationTrackingFullscreenViewProps) {
  if (!state.isLoaded) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-muted">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-card">
      <TrackingMap
        buses={state.filteredBuses}
        selectedBus={state.selectedBus}
        onBusSelect={state.setSelectedBus}
        center={state.mapCenter}
        zoom={state.mapZoom}
        onCenterChange={state.setMapCenter}
        onZoomChange={state.setMapZoom}
        viewMode={state.viewMode}
        onViewModeChange={state.handleViewModeChange}
        isLoaded={state.isLoaded}
        isLoading={state.isLoading}
        onViewBusDetails={state.handleViewBusDetails}
        onViewRoute={state.handleViewRoute}
      />
    </div>
  );
}
