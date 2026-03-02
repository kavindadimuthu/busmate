'use client';

import React, { useCallback, useMemo } from 'react';
import {
  SearchFilterBar,
  SelectFilter,
  SegmentedControl,
  type FilterChipDescriptor,
  type SegmentOption,
} from '@/components/shared/SearchFilterBar';
import {
  MapPin,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Wifi,
  WifiOff,
  Navigation,
  Bus,
} from 'lucide-react';
import type { TrackingFilterState, TrackingFilterOptions } from '@/types/location-tracking';

// ── Types ─────────────────────────────────────────────────────────

interface LocationTrackingAdvancedFiltersProps {
  // Search
  searchTerm: string;
  setSearchTerm: (value: string) => void;

  // Filters
  filters: TrackingFilterState;
  onFiltersChange: (filters: TrackingFilterState) => void;

  // Data
  filterOptions: TrackingFilterOptions;
  loading: boolean;

  // Stats for display
  totalCount: number;
  filteredCount: number;
  loadedCount?: number;

  // Event handlers
  onClearAll?: () => void;
  onSearch?: (term: string) => void;
}

// ── Device Status Segments ────────────────────────────────────────

const DEVICE_STATUS_SEGMENTS: SegmentOption[] = [
  { value: 'all', label: 'All Devices' },
  { value: 'online', label: 'Online', icon: <Wifi className="h-3 w-3" /> },
  { value: 'offline', label: 'Offline', icon: <WifiOff className="h-3 w-3" /> },
];

// ── Movement Status Segments ──────────────────────────────────────

const MOVEMENT_STATUS_SEGMENTS: SegmentOption[] = [
  { value: 'all', label: 'All' },
  { value: 'moving', label: 'Moving', icon: <Navigation className="h-3 w-3" /> },
  { value: 'idle', label: 'Idle', icon: <Clock className="h-3 w-3" /> },
  { value: 'stopped', label: 'Stopped', icon: <XCircle className="h-3 w-3" /> },
];

// ── Component ─────────────────────────────────────────────────────

/**
 * Location-tracking-specific search & filter bar.
 *
 * Wraps the generic `<SearchFilterBar>` with location tracking filter controls
 * (route dropdown, operator dropdown, device status, movement status, trip status)
 * and derives active filter chips automatically.
 */
export function LocationTrackingAdvancedFilters({
  searchTerm,
  setSearchTerm,
  filters,
  onFiltersChange,
  filterOptions,
  loading,
  totalCount,
  filteredCount,
  loadedCount,
  onClearAll,
  onSearch,
}: LocationTrackingAdvancedFiltersProps) {
  
  // Handle search — delegate to onSearch if provided, otherwise setSearchTerm
  const handleSearchChange = useCallback(
    (value: string) => {
      if (onSearch) {
        onSearch(value);
      } else {
        setSearchTerm(value);
      }
    },
    [onSearch, setSearchTerm]
  );

  // Update a single filter
  const updateFilter = useCallback(
    <K extends keyof TrackingFilterState>(key: K, value: TrackingFilterState[K]) => {
      onFiltersChange({ ...filters, [key]: value });
    },
    [filters, onFiltersChange]
  );

  // Clear all filters
  const handleClearAll = useCallback(() => {
    setSearchTerm('');
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
    onClearAll?.();
  }, [setSearchTerm, onFiltersChange, onClearAll]);

  // Build route select options
  const routeOptions = useMemo(() => {
    return filterOptions.routes.map((route) => ({
      value: route.id,
      label: route.name,
    }));
  }, [filterOptions.routes]);

  // Build operator select options
  const operatorOptions = useMemo(() => {
    return filterOptions.operators.map((operator) => ({
      value: operator.id,
      label: operator.name,
    }));
  }, [filterOptions.operators]);

  // Build trip status select options
  const tripStatusOptions = useMemo(() => {
    return filterOptions.tripStatuses.map((status) => {
      const label = status
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      return {
        value: status,
        label,
      };
    });
  }, [filterOptions.tripStatuses]);

  // Build active filter chips
  const chips: FilterChipDescriptor[] = [];

  if (filters.routeId !== 'all') {
    const route = filterOptions.routes.find((r) => r.id === filters.routeId);
    chips.push({
      key: 'route',
      label: route?.name || filters.routeId,
      onRemove: () => updateFilter('routeId', 'all'),
      colorClass: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: <MapPin className="h-3 w-3 opacity-70" />,
    });
  }

  if (filters.operatorId !== 'all') {
    const operator = filterOptions.operators.find((o) => o.id === filters.operatorId);
    chips.push({
      key: 'operator',
      label: operator?.name || filters.operatorId,
      onRemove: () => updateFilter('operatorId', 'all'),
      colorClass: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: <Building2 className="h-3 w-3 opacity-70" />,
    });
  }

  if (filters.tripStatus !== 'all') {
    const statusLabel = filters.tripStatus
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    chips.push({
      key: 'tripStatus',
      label: statusLabel,
      onRemove: () => updateFilter('tripStatus', 'all'),
      colorClass: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: <Clock className="h-3 w-3 opacity-70" />,
    });
  }

  if (filters.deviceStatus !== 'all') {
    chips.push({
      key: 'deviceStatus',
      label: filters.deviceStatus === 'online' ? 'Online' : 'Offline',
      onRemove: () => updateFilter('deviceStatus', 'all'),
      colorClass:
        filters.deviceStatus === 'online'
          ? 'bg-green-50 text-green-700 border-green-200'
          : 'bg-red-50 text-red-700 border-red-200',
      icon: filters.deviceStatus === 'online' ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />,
    });
  }

  if (filters.movementStatus !== 'all') {
    const statusLabel =
      filters.movementStatus.charAt(0).toUpperCase() + filters.movementStatus.slice(1);
    chips.push({
      key: 'movementStatus',
      label: statusLabel,
      onRemove: () => updateFilter('movementStatus', 'all'),
      colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: <Navigation className="h-3 w-3 opacity-70" />,
    });
  }

  if (filters.showOnlyActive) {
    chips.push({
      key: 'showOnlyActive',
      label: 'Active Only',
      onRemove: () => updateFilter('showOnlyActive', false),
      colorClass: 'bg-teal-50 text-teal-700 border-teal-200',
      icon: <CheckCircle2 className="h-3 w-3" />,
    });
  }

  if (!filters.showOfflineDevices) {
    chips.push({
      key: 'showOfflineDevices',
      label: 'Hide Offline',
      onRemove: () => updateFilter('showOfflineDevices', true),
      colorClass: 'bg-gray-50 text-gray-700 border-gray-200',
      icon: <WifiOff className="h-3 w-3" />,
    });
  }

  return (
    <SearchFilterBar
      searchValue={searchTerm}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Search by bus number, route, operator..."
      totalCount={totalCount}
      filteredCount={filteredCount}
      loadedCount={loadedCount}
      loading={loading}
      activeChips={chips}
      onClearAllFilters={chips.length > 0 ? handleClearAll : undefined}
      filters={
        <>
          {/* Route Filter */}
          <SelectFilter
            value={filters.routeId}
            onChange={(value: string) => updateFilter('routeId', value)}
            options={routeOptions}
            allLabel="All Routes"
            icon={<MapPin className="h-3.5 w-3.5" />}
          />

      {/* Operator Filter */}
      <SelectFilter
        value={filters.operatorId}
        onChange={(value: string) => updateFilter('operatorId', value)}
        options={operatorOptions}
        allLabel="All Operators"
        icon={<Building2 className="h-3.5 w-3.5" />}
      />

      {/* Trip Status Filter */}
      <SelectFilter
        value={filters.tripStatus}
        onChange={(value: string) => updateFilter('tripStatus', value)}
        options={tripStatusOptions}
        allLabel="All Statuses"
        icon={<Clock className="h-3.5 w-3.5" />}
      />

      {/* Device Status Segmented Control */}
      <SegmentedControl
        value={filters.deviceStatus}
        onChange={(value: string) => updateFilter('deviceStatus', value as 'all' | 'online' | 'offline')}
        options={DEVICE_STATUS_SEGMENTS}
      />

      {/* Movement Status Segmented Control */}
      <SegmentedControl
        value={filters.movementStatus}
        onChange={(value: string) =>
          updateFilter('movementStatus', value as 'all' | 'moving' | 'idle' | 'stopped')
        }
        options={MOVEMENT_STATUS_SEGMENTS}
      />
        </>
      }
    />
  );
}
