'use client';

import * as React from 'react';
import { FilterBar, FilterSelect } from '@busmate/ui';
import type { TrackingFilterState, TrackingFilterOptions } from '@/types/LocationTracking';

// ── Props ─────────────────────────────────────────────────────────

interface LocationTrackingFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: TrackingFilterState;
  onFiltersChange: (filters: TrackingFilterState) => void;
  onClearAll: () => void;
  filterOptions: TrackingFilterOptions;
  activeFilterCount?: number;
}

// ── Component ─────────────────────────────────────────────────────

export function LocationTrackingFilterBar({
  searchValue,
  onSearchChange,
  filters,
  onFiltersChange,
  onClearAll,
  filterOptions,
  activeFilterCount = 0,
}: LocationTrackingFilterBarProps) {
  const routeOptions = (filterOptions.routes || []).map((r) => ({
    value: r.id,
    label: r.name,
  }));

  const operatorOptions = (filterOptions.operators || []).map((op) => ({
    value: op.id,
    label: op.name,
  }));

  const tripStatusOptions = (filterOptions.tripStatuses || []).map((status) => ({
    value: status,
    label: status
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
  }));

  const deviceStatusOptions = [
    { value: 'online', label: 'Online' },
    { value: 'offline', label: 'Offline' },
  ];

  const movementStatusOptions = [
    { value: 'moving', label: 'Moving' },
    { value: 'idle', label: 'Idle' },
    { value: 'stopped', label: 'Stopped' },
  ];

  const updateFilter = <K extends keyof TrackingFilterState>(key: K, value: TrackingFilterState[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <FilterBar
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search by bus number, route, operator…"
      activeFilterCount={activeFilterCount}
      onClearAll={onClearAll}
    >
      <FilterSelect
        label="Route"
        value={filters.routeId ?? 'all'}
        onChange={(value) => updateFilter('routeId', value)}
        options={routeOptions}
        placeholder="All Routes"
        className="w-44"
      />
      <FilterSelect
        label="Operator"
        value={filters.operatorId ?? 'all'}
        onChange={(value) => updateFilter('operatorId', value)}
        options={operatorOptions}
        placeholder="All Operators"
        className="w-44"
      />
      <FilterSelect
        label="Trip Status"
        value={filters.tripStatus ?? 'all'}
        onChange={(value) => updateFilter('tripStatus', value)}
        options={tripStatusOptions}
        placeholder="All Statuses"
        className="w-40"
      />
      <FilterSelect
        label="Device"
        value={filters.deviceStatus ?? 'all'}
        onChange={(value) => updateFilter('deviceStatus', value)}
        options={deviceStatusOptions}
        placeholder="All Devices"
        className="w-36"
      />
      <FilterSelect
        label="Movement"
        value={filters.movementStatus ?? 'all'}
        onChange={(value) => updateFilter('movementStatus', value)}
        options={movementStatusOptions}
        placeholder="All"
        className="w-36"
      />
    </FilterBar>
  );
}
