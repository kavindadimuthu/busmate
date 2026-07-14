'use client';

import { Navigation } from 'lucide-react';
import { FilterBar, FilterSelect } from '@busmate/ui';
import { SegmentedControl } from '@/components/shared/SearchFilterBar';
import type { SegmentOption } from '@/components/shared/SearchFilterBar';

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
 * Wraps the generic `<FilterBar>` with route filter controls
 * (route group dropdown, direction segmented control, distance and
 * duration range inputs) and derives active filter count automatically.
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

  // Derive active filter count
  const activeFilterCount = [
    routeGroupFilter !== '__all__',
    directionFilter !== 'all',
    !!minDistance,
    !!maxDistance,
    !!minDuration,
    !!maxDuration,
  ].filter(Boolean).length;

  return (
    <FilterBar
      searchValue={searchTerm}
      onSearchChange={(val) => {
        setSearchTerm(val);
        onSearch?.(val);
      }}
      searchPlaceholder="Search routes by name, description, group, or stop names…"
      activeFilterCount={activeFilterCount}
      onClearAll={onClearAll}
    >
      {/* Route Group dropdown */}
      <FilterSelect
        label="Groups"
        value={routeGroupFilter}
        onChange={setRouteGroupFilter}
        options={routeGroupOptions}
      />

      {/* Direction segmented control */}
      <SegmentedControl
        value={directionFilter}
        onChange={setDirectionFilter}
        options={DIRECTION_SEGMENTS}
      />

      {/* Distance range */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground shrink-0">Dist (km):</span>
        <input
          type="number"
          placeholder="Min"
          value={minDistance}
          onChange={(e) => setMinDistance(e.target.value)}
          className="w-16 px-2 py-1.5 text-xs border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-warning/40 focus:bg-card transition-all"
        />
        <span className="text-muted-foreground/70 text-xs">–</span>
        <input
          type="number"
          placeholder="Max"
          value={maxDistance}
          onChange={(e) => setMaxDistance(e.target.value)}
          className="w-16 px-2 py-1.5 text-xs border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-warning/40 focus:bg-card transition-all"
        />
      </div>

      {/* Duration range */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground shrink-0">Dur (min):</span>
        <input
          type="number"
          placeholder="Min"
          value={minDuration}
          onChange={(e) => setMinDuration(e.target.value)}
          className="w-16 px-2 py-1.5 text-xs border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-primary/40 focus:bg-card transition-all"
        />
        <span className="text-muted-foreground/70 text-xs">–</span>
        <input
          type="number"
          placeholder="Max"
          value={maxDuration}
          onChange={(e) => setMaxDuration(e.target.value)}
          className="w-16 px-2 py-1.5 text-xs border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-primary/40 focus:bg-card transition-all"
        />
      </div>
    </FilterBar>
  );
}
