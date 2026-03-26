'use client';

import React from 'react';
import {
  LocationTrackingStatsCards,
  TrackingMap,
  TrackingBusList,
  LocationTrackingFilterBar,
} from '@/components/mot/location-tracking';
import type { LocationTrackingPageState } from '@/hooks/useLocationTrackingPage';

interface LocationTrackingLayoutProps {
  state: LocationTrackingPageState;
}

export function LocationTrackingLayout({ state }: LocationTrackingLayoutProps) {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-4 overflow-hidden">
      {/* Stats Cards */}
      <div className="flex-none">
        <LocationTrackingStatsCards
          metrics={state.statsMetrics}
          loading={state.isLoading && state.statsMetrics.length === 0}
          isCollapsed={state.statsCollapsed}
          onToggleCollapse={() => state.setStatsCollapsed(!state.statsCollapsed)}
          lastUpdate={state.lastUpdate}
        />
      </div>

      {/* Search & Filters */}
      <div className="flex-none">
        <LocationTrackingFilterBar
          searchValue={state.searchTerm}
          onSearchChange={state.handleSearchChange}
          filters={state.filters}
          onFiltersChange={state.setFilters}
          filterOptions={state.filterOptions}
          activeFilterCount={state.activeFilterCount}
          onClearAll={state.handleClearAllFilters}
        />
      </div>

      {/* Main Content: Map + Bus List */}
      <div className="flex-1 min-h-[300px] flex flex-col lg:flex-row gap-4 overflow-hidden">
        <div className="flex-1 min-w-0 transition-all duration-300">
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

        <div
          className={`transition-all duration-300 ease-in-out shrink-0 ${
            state.busListCollapsed ? 'w-full lg:w-16' : 'w-full lg:w-96'
          } flex flex-col bg-card rounded-xl border border-border shadow-sm overflow-hidden h-full`}
        >
          <TrackingBusList
            buses={state.filteredBuses}
            selectedBus={state.selectedBus}
            onBusSelect={state.setSelectedBus}
            onBusFocus={state.focusOnBus}
            isLoading={state.isLoading}
            error={state.error}
            isCollapsed={state.busListCollapsed}
            onToggleCollapse={() =>
              state.setBusListCollapsed(!state.busListCollapsed)
            }
          />
        </div>
      </div>
    </div>
  );
}
