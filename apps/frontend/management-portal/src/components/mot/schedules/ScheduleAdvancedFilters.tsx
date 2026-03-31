'use client';

import React, { useCallback } from 'react';
import { Calendar } from 'lucide-react';
import { FilterBar, FilterSelect } from '@busmate/ui';
import {
  SegmentedControl,
} from '@/components/shared/SearchFilterBar';
import type { SegmentOption } from '@/components/shared/SearchFilterBar';

// ── Types ─────────────────────────────────────────────────────────

interface FilterOptions {
  statuses: Array<'PENDING' | 'ACTIVE' | 'INACTIVE' | 'CANCELLED'>;
  scheduleTypes: Array<'REGULAR' | 'SPECIAL'>;
  routes: Array<{ id: string; name: string; routeGroup?: string }>;
}

interface ScheduleAdvancedFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  scheduleTypeFilter: string;
  setScheduleTypeFilter: (value: string) => void;
  routeFilter: string;
  setRouteFilter: (value: string) => void;
  effectiveStartDate: string;
  setEffectiveStartDate: (value: string) => void;
  effectiveEndDate: string;
  setEffectiveEndDate: (value: string) => void;
  filterOptions: FilterOptions;
  loading: boolean;
  totalCount?: number;
  filteredCount?: number;
  onClearAll?: () => void;
  onSearch?: (term: string) => void;
}

// ── Schedule-type segment options ─────────────────────────────────

const SCHEDULE_TYPE_SEGMENTS: SegmentOption[] = [
  { value: 'all',     label: 'All Types' },
  { value: 'REGULAR', label: 'Regular',  icon: <Calendar className="h-3 w-3" /> },
  { value: 'SPECIAL', label: 'Special',  icon: <Calendar className="h-3 w-3" /> },
];

// ── Component ─────────────────────────────────────────────────────

/**
 * Schedule-specific search & filter bar.
 *
 * Wraps the generic <FilterBar> with schedule filter controls
 * (status dropdown, schedule-type segmented control, route dropdown, date range)
 * and derives active filter count automatically.
 */
export function ScheduleAdvancedFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  scheduleTypeFilter,
  setScheduleTypeFilter,
  routeFilter,
  setRouteFilter,
  effectiveStartDate,
  setEffectiveStartDate,
  effectiveEndDate,
  setEffectiveEndDate,
  filterOptions,
  loading,
  totalCount = 0,
  filteredCount = 0,
  onClearAll,
  onSearch,
}: ScheduleAdvancedFiltersProps) {

  const handleSearchChange = useCallback(
    (value: string) => {
      if (onSearch) {
        onSearch(value);
      } else {
        setSearchTerm(value);
      }
    },
    [onSearch, setSearchTerm],
  );

  const handleClearAll = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('__all__');
    setScheduleTypeFilter('all');
    setRouteFilter('__all__');
    setEffectiveStartDate('');
    setEffectiveEndDate('');
    onClearAll?.();
  }, [setSearchTerm, setStatusFilter, setScheduleTypeFilter, setRouteFilter,
      setEffectiveStartDate, setEffectiveEndDate, onClearAll]);

  const statusOptions = filterOptions.statuses.map((s) => ({
    value: s,
    label: s.charAt(0) + s.slice(1).toLowerCase(),
  }));

  const routeOptions = filterOptions.routes.map((r) => ({
    value: r.id,
    label: r.routeGroup ? r.name + ' (' + r.routeGroup + ')' : r.name,
  }));

  // Active filter count
  const activeFilterCount = [
    statusFilter !== '__all__',
    scheduleTypeFilter !== 'all',
    routeFilter !== '__all__',
    !!effectiveStartDate,
    !!effectiveEndDate,
  ].filter(Boolean).length;

  return (
    <FilterBar
      searchValue={searchTerm}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Search schedules by name, route, or description..."
      activeFilterCount={activeFilterCount}
      onClearAll={handleClearAll}
    >
      <FilterSelect
        label="Statuses"
        value={statusFilter}
        onChange={setStatusFilter}
        options={statusOptions}
      />
      <SegmentedControl
        value={scheduleTypeFilter}
        onChange={setScheduleTypeFilter}
        options={SCHEDULE_TYPE_SEGMENTS}
      />
      <FilterSelect
        label="Routes"
        value={routeFilter}
        onChange={setRouteFilter}
        options={routeOptions}
      />
          <div className="flex items-center gap-1.5 shrink-0">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
            <input
              type="date"
              value={effectiveStartDate}
              onChange={(e) => setEffectiveStartDate(e.target.value)}
              className="border border-border rounded-md px-2 py-1.5 text-xs text-foreground/80 bg-card focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-primary/40"
              title="Effective from"
            />
            <span className="text-xs text-muted-foreground/70">to</span>
            <input
              type="date"
              value={effectiveEndDate}
              onChange={(e) => setEffectiveEndDate(e.target.value)}
              className="border border-border rounded-md px-2 py-1.5 text-xs text-foreground/80 bg-card focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-primary/40"
              title="Effective to"
            />
          </div>
    </FilterBar>
  );
}

export default ScheduleAdvancedFilters;
