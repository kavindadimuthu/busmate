'use client';

import { useCallback } from 'react';
import { FilterBar, FilterSelect } from '@busmate/ui';
import type { OperatorTripFilterOptions, TripStatus } from '@/data/operator/trips';

// ── Types ─────────────────────────────────────────────────────────

interface OperatorTripsFiltersProps {
  // Search
  searchTerm: string;
  setSearchTerm: (value: string) => void;

  // Filters
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  routeFilter: string;
  setRouteFilter: (value: string) => void;
  scheduleFilter: string;
  setScheduleFilter: (value: string) => void;
  busFilter: string;
  setBusFilter: (value: string) => void;
  permitFilter: string;
  setPermitFilter: (value: string) => void;
  fromDate: string;
  setFromDate: (value: string) => void;
  toDate: string;
  setToDate: (value: string) => void;

  // Data
  filterOptions: OperatorTripFilterOptions;
  loading?: boolean;

  // Counts
  totalCount?: number;
  filteredCount?: number;

  // Events
  onClearAll?: () => void;
  onSearch?: (term: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────

const STATUS_LABELS: Record<TripStatus, string> = {
  PENDING: 'Pending',
  ACTIVE: 'Active',
  IN_TRANSIT: 'In Transit',
  BOARDING: 'Boarding',
  DEPARTED: 'Departed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  DELAYED: 'Delayed',
};

// ── Component ─────────────────────────────────────────────────────

/**
 * Search + filter bar for the operator trips listing page.
 *
 * Delegates rendering to the shared `<SearchFilterBar>` component, keeping
 * the UI consistent with other listing pages (e.g. MOT trips, permits).
 */
export function OperatorTripsFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  routeFilter,
  setRouteFilter,
  scheduleFilter,
  setScheduleFilter,
  busFilter,
  setBusFilter,
  permitFilter,
  setPermitFilter,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  filterOptions,
  loading = false,
  totalCount = 0,
  filteredCount = 0,
  onClearAll,
  onSearch,
}: OperatorTripsFiltersProps) {
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
    setRouteFilter('__all__');
    setScheduleFilter('__all__');
    setBusFilter('__all__');
    setPermitFilter('__all__');
    setFromDate('');
    setToDate('');
    onClearAll?.();
  }, [
    setSearchTerm, setStatusFilter, setRouteFilter, setScheduleFilter,
    setBusFilter, setPermitFilter, setFromDate, setToDate, onClearAll,
  ]);

  // ── Active filter count ─────────────────────────────────────────

  const activeFilterCount = [statusFilter, routeFilter, scheduleFilter, busFilter, permitFilter].filter(v => v !== '__all__').length + (fromDate ? 1 : 0) + (toDate ? 1 : 0);

  return (
    <FilterBar
      searchValue={searchTerm}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Search trips by route, bus, permit, driver…"
      activeFilterCount={activeFilterCount}
      onClearAll={handleClearAll}
    >
      <FilterSelect
        label="Statuses"
        value={statusFilter}
        onChange={setStatusFilter}
        options={filterOptions.statuses.map((s) => ({
          value: s,
          label: STATUS_LABELS[s] ?? s,
        }))}
      />
      <FilterSelect
        label="Routes"
        value={routeFilter}
        onChange={setRouteFilter}
        options={filterOptions.routes.map((r) => ({
          value: r.id,
          label: `${r.routeNumber} – ${r.name}`,
        }))}
      />
      <FilterSelect
        label="Schedules"
        value={scheduleFilter}
        onChange={setScheduleFilter}
        options={filterOptions.schedules.map((s) => ({
          value: s.id,
          label: s.name,
        }))}
      />
      <FilterSelect
        label="Buses"
        value={busFilter}
        onChange={setBusFilter}
        options={filterOptions.buses.map((b) => ({
          value: b.id,
          label: b.registrationNumber,
        }))}
      />
      <FilterSelect
        label="Permits"
        value={permitFilter}
        onChange={setPermitFilter}
        options={filterOptions.permits.map((p) => ({
          value: p.id,
          label: p.permitNumber,
        }))}
      />
      <input
        type="date"
        value={fromDate}
        onChange={(e) => setFromDate(e.target.value)}
        className="appearance-none pl-3 pr-2 py-1.5 text-xs font-medium rounded-lg border bg-muted border-border text-muted-foreground hover:border-border hover:bg-card focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-400 transition-all duration-150"
        title="From Date"
      />
      <input
        type="date"
        value={toDate}
        onChange={(e) => setToDate(e.target.value)}
        className="appearance-none pl-3 pr-2 py-1.5 text-xs font-medium rounded-lg border bg-muted border-border text-muted-foreground hover:border-border hover:bg-card focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-400 transition-all duration-150"
        title="To Date"
      />
    </FilterBar>
  );
}