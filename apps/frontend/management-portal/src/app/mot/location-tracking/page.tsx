'use client';

import React from 'react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { useLocationTrackingPage } from '@/hooks/useLocationTrackingPage';
import {
  LocationTrackingActionButtons,
  LocationTrackingFullscreenView,
  LocationTrackingLayout,
} from '@/components/mot/location-tracking';

export default function LocationTrackingPage() {
  const state = useLocationTrackingPage();

  useSetPageMetadata({
    title: 'Location Tracking',
    description: 'Real-time bus location monitoring and fleet tracking',
    activeItem: 'location-tracking',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Location Tracking' }],
  });

  useSetPageActions(
    <LocationTrackingActionButtons
      autoRefresh={state.autoRefresh}
      onAutoRefreshToggle={() => state.setAutoRefresh(!state.autoRefresh)}
      onRefresh={state.refresh}
      isLoading={state.isLoading}
      viewMode={state.viewMode}
      onViewModeChange={state.handleViewModeChange}
      lastUpdate={state.lastUpdate}
    />
  );

  if (state.viewMode === 'fullscreen') {
    return <LocationTrackingFullscreenView state={state} />;
  }

  return <LocationTrackingLayout state={state} />;
}

