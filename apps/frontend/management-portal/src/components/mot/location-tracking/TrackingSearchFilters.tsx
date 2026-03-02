'use client';

import React, { useState, useCallback } from 'react';
import {
  Search,
  Filter,
  X,
  RefreshCw,
  Wifi,
  WifiOff,
  Route,
  Bus,
  Clock,
  ChevronDown,
} from 'lucide-react';
import type { TrackingFilterState, TrackingFilterOptions } from '@/types/location-tracking';

// ── Props ─────────────────────────────────────────────────────────

interface TrackingSearchFiltersProps {
  /** Current filter state */
  filters: TrackingFilterState;
  /** Callback when filters change */
  onFiltersChange: (filters: TrackingFilterState) => void;
  /** Available filter options */
  filterOptions: TrackingFilterOptions;
  /** Auto-refresh enabled state */
  autoRefresh: boolean;
  /** Callback to toggle auto-refresh */
  onAutoRefreshToggle: () => void;
  /** Refresh interval in seconds */
  refreshInterval: number;
  /** Callback to change refresh interval */
  onRefreshIntervalChange: (interval: number) => void;
  /** Loading state */
  isLoading: boolean;
  /** Number of filtered results */
  filteredCount: number;
  /** Total number of buses */
  totalCount: number;
  /** Callback for manual refresh */
  onRefresh: () => void;
}

// ── Active Filter Chip ────────────────────────────────────────────

interface FilterChipProps {
  label: string;
  onRemove: () => void;
  colorClass?: string;
}

function FilterChip({ label, onRemove, colorClass = 'bg-blue-50 text-blue-700 border-blue-200' }: FilterChipProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
      {label}
      <button
        onClick={onRemove}
        className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────

/**
 * Search and filter bar for the location tracking page.
 * Provides comprehensive filtering options for tracked buses.
 */
export function TrackingSearchFilters({
  filters,
  onFiltersChange,
  filterOptions,
  autoRefresh,
  onAutoRefreshToggle,
  refreshInterval,
  onRefreshIntervalChange,
  isLoading,
  filteredCount,
  totalCount,
  onRefresh,
}: TrackingSearchFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = useCallback(
    <K extends keyof TrackingFilterState>(key: K, value: TrackingFilterState[K]) => {
      onFiltersChange({ ...filters, [key]: value });
    },
    [filters, onFiltersChange]
  );

  const clearAllFilters = useCallback(() => {
    onFiltersChange({
      search: '',
      routeId: 'all',
      operatorId: 'all',
      tripStatus: 'all',
      deviceStatus: 'all',
      movementStatus: 'all',
      showOnlyActive: false,
      showOfflineDevices: true,
    });
  }, [onFiltersChange]);

  // Count active filters
  const activeFilterCount = [
    filters.routeId !== 'all',
    filters.operatorId !== 'all',
    filters.tripStatus !== 'all',
    filters.deviceStatus !== 'all',
    filters.movementStatus !== 'all',
    filters.showOnlyActive,
    !filters.showOfflineDevices,
  ].filter(Boolean).length;

  // Get active filter chips
  const getActiveChips = () => {
    const chips: { key: string; label: string; onRemove: () => void; color: string }[] = [];

    if (filters.routeId !== 'all') {
      const route = filterOptions.routes.find(r => r.id === filters.routeId);
      chips.push({
        key: 'route',
        label: `Route: ${route?.name || filters.routeId}`,
        onRemove: () => updateFilter('routeId', 'all'),
        color: 'bg-purple-50 text-purple-700 border-purple-200',
      });
    }

    if (filters.operatorId !== 'all') {
      const operator = filterOptions.operators.find(o => o.id === filters.operatorId);
      chips.push({
        key: 'operator',
        label: `Operator: ${operator?.name || filters.operatorId}`,
        onRemove: () => updateFilter('operatorId', 'all'),
        color: 'bg-teal-50 text-teal-700 border-teal-200',
      });
    }

    if (filters.tripStatus !== 'all') {
      chips.push({
        key: 'tripStatus',
        label: `Status: ${filters.tripStatus.replace('_', ' ')}`,
        onRemove: () => updateFilter('tripStatus', 'all'),
        color: 'bg-amber-50 text-amber-700 border-amber-200',
      });
    }

    if (filters.deviceStatus !== 'all') {
      chips.push({
        key: 'deviceStatus',
        label: `Device: ${filters.deviceStatus}`,
        onRemove: () => updateFilter('deviceStatus', 'all'),
        color: filters.deviceStatus === 'online' 
          ? 'bg-green-50 text-green-700 border-green-200'
          : 'bg-red-50 text-red-700 border-red-200',
      });
    }

    if (filters.movementStatus !== 'all') {
      chips.push({
        key: 'movement',
        label: `Movement: ${filters.movementStatus}`,
        onRemove: () => updateFilter('movementStatus', 'all'),
        color: 'bg-blue-50 text-blue-700 border-blue-200',
      });
    }

    if (filters.showOnlyActive) {
      chips.push({
        key: 'activeOnly',
        label: 'Active buses only',
        onRemove: () => updateFilter('showOnlyActive', false),
        color: 'bg-green-50 text-green-700 border-green-200',
      });
    }

    if (!filters.showOfflineDevices) {
      chips.push({
        key: 'hideOffline',
        label: 'Hiding offline',
        onRemove: () => updateFilter('showOfflineDevices', true),
        color: 'bg-gray-50 text-gray-700 border-gray-200',
      });
    }

    return chips;
  };

  const activeChips = getActiveChips();

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Main Search Row */}
      <div className="p-4 flex flex-col lg:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder="Search by bus number, route, or operator..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          />
          {filters.search && (
            <button
              onClick={() => updateFilter('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Route Filter */}
          <div className="relative">
            <select
              value={filters.routeId}
              onChange={(e) => updateFilter('routeId', e.target.value)}
              className="appearance-none pl-9 pr-8 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer min-w-[180px]"
            >
              <option value="all">All Routes</option>
              {filterOptions.routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.name}
                </option>
              ))}
            </select>
            <Route className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={filters.tripStatus}
              onChange={(e) => updateFilter('tripStatus', e.target.value)}
              className="appearance-none pl-9 pr-8 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer min-w-[140px]"
            >
              <option value="all">All Statuses</option>
              <option value="in_transit">In Transit</option>
              <option value="on_time">On Time</option>
              <option value="delayed">Delayed</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
            </select>
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Device Status Filter */}
          <div className="relative">
            <select
              value={filters.deviceStatus}
              onChange={(e) => updateFilter('deviceStatus', e.target.value)}
              className="appearance-none pl-9 pr-8 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer min-w-[130px]"
            >
              <option value="all">All Devices</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
            <Wifi className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
              showAdvanced || activeFilterCount > 0
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Refresh Controls */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-100">
          <div className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Operator Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Operator
              </label>
              <select
                value={filters.operatorId}
                onChange={(e) => updateFilter('operatorId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Operators</option>
                {filterOptions.operators.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Movement Status */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Movement Status
              </label>
              <select
                value={filters.movementStatus}
                onChange={(e) => updateFilter('movementStatus', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="moving">Moving</option>
                <option value="idle">Idle</option>
                <option value="stopped">Stopped</option>
              </select>
            </div>

            {/* Auto-refresh Settings */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Auto-refresh Interval
              </label>
              <div className="flex gap-2">
                <select
                  value={refreshInterval}
                  onChange={(e) => onRefreshIntervalChange(Number(e.target.value))}
                  disabled={!autoRefresh}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                >
                  <option value={5}>5 seconds</option>
                  <option value={10}>10 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>1 minute</option>
                </select>
                <button
                  onClick={onAutoRefreshToggle}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    autoRefresh
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  {autoRefresh ? 'On' : 'Off'}
                </button>
              </div>
            </div>

            {/* Toggle Options */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Display Options
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showOnlyActive}
                  onChange={(e) => updateFilter('showOnlyActive', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Show only active buses</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showOfflineDevices}
                  onChange={(e) => updateFilter('showOfflineDevices', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Show offline devices</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Bar */}
      {(activeChips.length > 0 || filters.search) && (
        <div className="px-4 pb-3 pt-0 flex flex-wrap items-center gap-2 border-t border-gray-100">
          <span className="text-xs text-gray-500 pt-3">Active filters:</span>
          <div className="flex flex-wrap gap-2 pt-3">
            {filters.search && (
              <FilterChip
                label={`Search: "${filters.search}"`}
                onRemove={() => updateFilter('search', '')}
                colorClass="bg-gray-100 text-gray-700 border-gray-200"
              />
            )}
            {activeChips.map((chip) => (
              <FilterChip
                key={chip.key}
                label={chip.label}
                onRemove={chip.onRemove}
                colorClass={chip.color}
              />
            ))}
          </div>
          {(activeChips.length > 0 || filters.search) && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium ml-auto pt-3"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
        <span>
          Showing <strong>{filteredCount}</strong> of <strong>{totalCount}</strong> tracked buses
        </span>
        {autoRefresh && (
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Live updates every {refreshInterval}s
          </span>
        )}
      </div>
    </div>
  );
}
