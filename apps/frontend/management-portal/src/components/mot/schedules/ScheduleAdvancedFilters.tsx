'use client';

import React, { useCallback } from 'react';
import { Calendar, CheckCircle, XCircle, Route } from 'lucide-react';
import {
  SearchFilterBar,
  SelectFilter,
  SegmentedControl,
} from '@/components/shared/SearchFilterBar';
import type { FilterChipDescriptor, SegmentOption } from '@/components/shared/SearchFilterBar';

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
 * Wraps the generic <SearchFilterBar> with schedule filter controls
 * (status dropdown, schedule-type segmented control, route dropdown, date range)
 * and derives active filter chips automatically.
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
    setStatusFilter('all');
    setScheduleTypeFilter('all');
    setRouteFilter('all');
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

  // Active filter chips
  const chips: FilterChipDescriptor[] = [];

  if (statusFilter !== 'all') {
    const label = statusFilter.charAt(0) + statusFilter.slice(1).toLowerCase();
    const colorMap: Record<string, string> = {
      ACTIVE:    'bg-green-50 text-green-700 border-green-200',
      INACTIVE:  'bg-red-50 text-red-700 border-red-200',
      PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
      CANCELLED: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    chips.push({
      key: 'status',
      label,
      onRemove: () => setStatusFilter('all'),
      colorClass: colorMap[statusFilter] ?? 'bg-gray-100 text-gray-700 border-gray-200',
      icon: statusFilter === 'ACTIVE'
        ? <CheckCircle className="h-3 w-3 opacity-70" />
        : <XCircle className="h-3 w-3 opacity-70" />,
    });
  }

  if (scheduleTypeFilter !== 'all') {
    chips.push({
      key: 'scheduleType',
      label: scheduleTypeFilter === 'REGULAR' ? 'Regular' : 'Special',
      onRemove: () => setScheduleTypeFilter('all'),
      colorClass: scheduleTypeFilter === 'REGULAR'
        ? 'bg-blue-50 text-blue-700 border-blue-200'
        : 'bg-purple-50 text-purple-700 border-purple-200',
      icon: <Calendar className="h-3 w-3 opacity-70" />,
    });
  }

  if (routeFilter !== 'all') {
    const routeName = filterOptions.routes.find((r) => r.id === routeFilter)?.name ?? routeFilter;
    chips.push({
      key: 'route',
      label: routeName,
      onRemove: () => setRouteFilter('all'),
      colorClass: 'bg-teal-50 text-teal-700 border-teal-200',
      icon: <Route className="h-3 w-3 opacity-70" />,
    });
  }

  if (effectiveStartDate) {
    chips.push({
      key: 'startDate',
      label: 'From: ' + effectiveStartDate,
      onRemove: () => setEffectiveStartDate(''),
      colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    });
  }

  if (effectiveEndDate) {
    chips.push({
      key: 'endDate',
      label: 'To: ' + effectiveEndDate,
      onRemove: () => setEffectiveEndDate(''),
      colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    });
  }

  return (
    <SearchFilterBar
      searchValue={searchTerm}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Search schedules by name, route, or description..."
      totalCount={totalCount}
      filteredCount={filteredCount}
      resultLabel="schedule"
      loading={loading}
      filters={
        <>
          <SelectFilter
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            allLabel="All Statuses"
          />
          <SegmentedControl
            value={scheduleTypeFilter}
            onChange={setScheduleTypeFilter}
            options={SCHEDULE_TYPE_SEGMENTS}
          />
          <SelectFilter
            value={routeFilter}
            onChange={setRouteFilter}
            options={routeOptions}
            allLabel="All Routes"
            icon={<Route className="h-3.5 w-3.5" />}
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <input
              type="date"
              value={effectiveStartDate}
              onChange={(e) => setEffectiveStartDate(e.target.value)}
              className="border border-gray-200 rounded-md px-2 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
              title="Effective from"
            />
            <span className="text-xs text-gray-400">to</span>
            <input
              type="date"
              value={effectiveEndDate}
              onChange={(e) => setEffectiveEndDate(e.target.value)}
              className="border border-gray-200 rounded-md px-2 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
              title="Effective to"
            />
          </div>
        </>
      }
      activeChips={chips}
      onClearAllFilters={handleClearAll}
    />
  );
}

export default ScheduleAdvancedFilters;
