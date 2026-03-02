'use client';

import { Navigation, Route as RouteIcon } from 'lucide-react';
import { SearchFilterBar, SelectFilter, SegmentedControl } from '@/components/shared/SearchFilterBar';
import type { FilterChipDescriptor, SegmentOption } from '@/components/shared/SearchFilterBar';

// ── Types ─────────────────────────────────────────────────────────

interface FilterOptions {
  routeGroups: Array<{ id: string; name: string }>;
  directions: Array<'OUTBOUND' | 'INBOUND'>;
  roadTypes: Array<'NORMALWAY' | 'EXPRESSWAY'>;
  distanceRange: { min: number; max: number };
  durationRange: { min: number; max: number };
}

export interface RouteAdvancedFiltersProps {
  // Search
  searchTerm: string;
  setSearchTerm: (value: string) => void;

  // Filters
  routeGroupFilter: string;
  setRouteGroupFilter: (value: string) => void;
  directionFilter: string;
  setDirectionFilter: (value: string) => void;
  minDistance: string;
  setMinDistance: (value: string) => void;
  maxDistance: string;
  setMaxDistance: (value: string) => void;
  minDuration: string;
  setMinDuration: (value: string) => void;
  maxDuration: string;
  setMaxDuration: (value: string) => void;

  // Data
  filterOptions: FilterOptions;
  loading: boolean;

  // Stats for display
  totalCount?: number;
  filteredCount?: number;

  // Event handlers
  onClearAll?: () => void;
  onSearch?: (term: string) => void;
}

// ── Direction segment options ──────────────────────────────────────

const DIRECTION_SEGMENTS: SegmentOption[] = [
  { value: 'all', label: 'All' },
  { value: 'OUTBOUND', label: 'Outbound', icon: <Navigation className="h-3 w-3" /> },
  { value: 'INBOUND', label: 'Inbound', icon: <Navigation className="h-3 w-3 rotate-180" /> },
];

// ── Component ─────────────────────────────────────────────────────

/**
 * Route-specific search & filter bar.
 *
 * Wraps the generic `<SearchFilterBar>` with route filter controls
 * (route group dropdown, direction segmented control, distance and
 * duration range inputs) and derives active filter chips automatically.
 */
export function RouteAdvancedFilters({
  searchTerm,
  setSearchTerm,
  routeGroupFilter,
  setRouteGroupFilter,
  directionFilter,
  setDirectionFilter,
  minDistance,
  setMinDistance,
  maxDistance,
  setMaxDistance,
  minDuration,
  setMinDuration,
  maxDuration,
  setMaxDuration,
  filterOptions,
  loading,
  totalCount = 0,
  filteredCount = 0,
  onClearAll,
  onSearch,
}: RouteAdvancedFiltersProps) {
  const routeGroupOptions = filterOptions.routeGroups.map((rg) => ({
    value: rg.id,
    label: rg.name,
  }));

  // Derive active filter chips
  const chips: FilterChipDescriptor[] = [
    routeGroupFilter !== 'all' && {
      key: 'routeGroup',
      label: filterOptions.routeGroups.find((rg) => rg.id === routeGroupFilter)?.name ?? routeGroupFilter,
      onRemove: () => setRouteGroupFilter('all'),
      colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    directionFilter !== 'all' && {
      key: 'direction',
      label: directionFilter === 'OUTBOUND' ? 'Outbound' : 'Inbound',
      onRemove: () => setDirectionFilter('all'),
      colorClass: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    minDistance && {
      key: 'minDistance',
      label: `Min ${minDistance} km`,
      onRemove: () => setMinDistance(''),
      colorClass: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    maxDistance && {
      key: 'maxDistance',
      label: `Max ${maxDistance} km`,
      onRemove: () => setMaxDistance(''),
      colorClass: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    minDuration && {
      key: 'minDuration',
      label: `Min ${minDuration} min`,
      onRemove: () => setMinDuration(''),
      colorClass: 'bg-teal-50 text-teal-700 border-teal-200',
    },
    maxDuration && {
      key: 'maxDuration',
      label: `Max ${maxDuration} min`,
      onRemove: () => setMaxDuration(''),
      colorClass: 'bg-teal-50 text-teal-700 border-teal-200',
    },
  ].filter(Boolean) as FilterChipDescriptor[];

  return (
    <SearchFilterBar
      searchValue={searchTerm}
      onSearchChange={(val) => {
        setSearchTerm(val);
        onSearch?.(val);
      }}
      searchPlaceholder="Search routes by name, description, group, or stop names…"
      totalCount={totalCount}
      filteredCount={filteredCount}
      resultLabel="route"
      loading={loading}
      filters={
        <>
          {/* Route Group dropdown */}
          <SelectFilter
            value={routeGroupFilter}
            onChange={setRouteGroupFilter}
            options={routeGroupOptions}
            allLabel="All Groups"
            icon={<RouteIcon className="h-3.5 w-3.5" />}
            activeColorClass="bg-indigo-50 border-indigo-300 text-indigo-800"
          />

          {/* Direction segmented control */}
          <SegmentedControl
            value={directionFilter}
            onChange={setDirectionFilter}
            options={DIRECTION_SEGMENTS}
          />

          {/* Distance range */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 shrink-0">Dist (km):</span>
            <input
              type="number"
              placeholder="Min"
              value={minDistance}
              onChange={(e) => setMinDistance(e.target.value)}
              className="w-16 px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-400 focus:bg-white transition-all"
            />
            <span className="text-gray-400 text-xs">–</span>
            <input
              type="number"
              placeholder="Max"
              value={maxDistance}
              onChange={(e) => setMaxDistance(e.target.value)}
              className="w-16 px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-400 focus:bg-white transition-all"
            />
          </div>

          {/* Duration range */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 shrink-0">Dur (min):</span>
            <input
              type="number"
              placeholder="Min"
              value={minDuration}
              onChange={(e) => setMinDuration(e.target.value)}
              className="w-16 px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-400 focus:bg-white transition-all"
            />
            <span className="text-gray-400 text-xs">–</span>
            <input
              type="number"
              placeholder="Max"
              value={maxDuration}
              onChange={(e) => setMaxDuration(e.target.value)}
              className="w-16 px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-400 focus:bg-white transition-all"
            />
          </div>
        </>
      }
      activeChips={chips}
      onClearAllFilters={onClearAll}
    />
  );
}
