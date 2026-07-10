'use client';

import { useCallback, useMemo } from 'react';
import { FilterBar, FilterSelect } from '@busmate/ui';
import {
  SegmentedControl,
  type SegmentOption,
} from '@/components/shared/SearchFilterBar';
import {
  XCircle,
  Clock,
  Wifi,
  WifiOff,
  Navigation,
} from 'lucide-react';
import type { TrackingFilterState, TrackingFilterOptions } from '@/types/LocationTracking';

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
      routeId: '__all__',
      operatorId: '__all__',
      tripStatus: '__all__',
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

  const activeFilterCount = [filters.routeId, filters.operatorId, filters.tripStatus].filter(v => v !== '__all__').length
    + [filters.deviceStatus, filters.movementStatus].filter(v => v !== 'all').length
    + (filters.showOnlyActive ? 1 : 0)
    + (!filters.showOfflineDevices ? 1 : 0);

  return (
    <FilterBar
      searchValue={searchTerm}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Search by bus number, route, operator..."
      activeFilterCount={activeFilterCount}
      onClearAll={handleClearAll}
    >
      {/* Route Filter */}
      <FilterSelect
        label="Routes"
        value={filters.routeId}
        onChange={(value: string) => updateFilter('routeId', value)}
        options={routeOptions}
      />

      {/* Operator Filter */}
      <FilterSelect
        label="Operators"
        value={filters.operatorId}
        onChange={(value: string) => updateFilter('operatorId', value)}
        options={operatorOptions}
      />

      {/* Trip Status Filter */}
      <FilterSelect
        label="Statuses"
        value={filters.tripStatus}
        onChange={(value: string) => updateFilter('tripStatus', value)}
        options={tripStatusOptions}
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
    </FilterBar>
  );
}
