'use client';

import { useCallback } from 'react';
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  MapPin,
  Bus,
  Calendar,
  FileText,
  Navigation2,
} from 'lucide-react';
import {
  SearchFilterBar,
  SelectFilter,
} from '@/components/shared/SearchFilterBar';
import type { FilterChipDescriptor } from '@/components/shared/SearchFilterBar';
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
    setStatusFilter('all');
    setRouteFilter('all');
    setScheduleFilter('all');
    setBusFilter('all');
    setPermitFilter('all');
    setFromDate('');
    setToDate('');
    onClearAll?.();
  }, [
    setSearchTerm, setStatusFilter, setRouteFilter, setScheduleFilter,
    setBusFilter, setPermitFilter, setFromDate, setToDate, onClearAll,
  ]);

  // ── Active filter chips ─────────────────────────────────────────

  const chips: FilterChipDescriptor[] = [];

  if (statusFilter !== 'all') {
    chips.push({
      key: 'status',
      label: STATUS_LABELS[statusFilter as TripStatus] || statusFilter,
      onRemove: () => setStatusFilter('all'),
      colorClass: 'bg-green-50 text-green-700 border-green-200',
      icon: <CheckCircle className="h-3 w-3 opacity-70" />,
    });
  }

  if (routeFilter !== 'all') {
    const route = filterOptions.routes.find((r) => r.id === routeFilter);
    chips.push({
      key: 'route',
      label: `Route: ${route ? `${route.routeNumber} – ${route.name}` : routeFilter}`,
      onRemove: () => setRouteFilter('all'),
      colorClass: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: <MapPin className="h-3 w-3 opacity-70" />,
    });
  }

  if (scheduleFilter !== 'all') {
    const schedule = filterOptions.schedules.find((s) => s.id === scheduleFilter);
    chips.push({
      key: 'schedule',
      label: `Schedule: ${schedule?.name || scheduleFilter}`,
      onRemove: () => setScheduleFilter('all'),
      colorClass: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: <Clock className="h-3 w-3 opacity-70" />,
    });
  }

  if (busFilter !== 'all') {
    const bus = filterOptions.buses.find((b) => b.id === busFilter);
    chips.push({
      key: 'bus',
      label: `Bus: ${bus?.registrationNumber || busFilter}`,
      onRemove: () => setBusFilter('all'),
      colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: <Bus className="h-3 w-3 opacity-70" />,
    });
  }

  if (permitFilter !== 'all') {
    const permit = filterOptions.permits.find((p) => p.id === permitFilter);
    chips.push({
      key: 'permit',
      label: `PSP: ${permit?.permitNumber || permitFilter}`,
      onRemove: () => setPermitFilter('all'),
      colorClass: 'bg-teal-50 text-teal-700 border-teal-200',
      icon: <FileText className="h-3 w-3 opacity-70" />,
    });
  }

  if (fromDate) {
    chips.push({
      key: 'from-date',
      label: `From: ${fromDate}`,
      onRemove: () => setFromDate(''),
      colorClass: 'bg-orange-50 text-orange-700 border-orange-200',
      icon: <Calendar className="h-3 w-3 opacity-70" />,
    });
  }

  if (toDate) {
    chips.push({
      key: 'to-date',
      label: `To: ${toDate}`,
      onRemove: () => setToDate(''),
      colorClass: 'bg-orange-50 text-orange-700 border-orange-200',
      icon: <Calendar className="h-3 w-3 opacity-70" />,
    });
  }

  return (
    <SearchFilterBar
      searchValue={searchTerm}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Search trips by route, bus, permit, driver…"
      totalCount={totalCount}
      filteredCount={filteredCount}
      resultLabel="trip"
      loading={loading}
      filters={
        <>
          <SelectFilter
            value={statusFilter}
            onChange={setStatusFilter}
            options={filterOptions.statuses.map((s) => ({
              value: s,
              label: STATUS_LABELS[s] ?? s,
            }))}
            allLabel="All Statuses"
            icon={<AlertCircle className="h-3.5 w-3.5" />}
          />
          <SelectFilter
            value={routeFilter}
            onChange={setRouteFilter}
            options={filterOptions.routes.map((r) => ({
              value: r.id,
              label: `${r.routeNumber} – ${r.name}`,
            }))}
            allLabel="All Routes"
            icon={<MapPin className="h-3.5 w-3.5" />}
          />
          <SelectFilter
            value={scheduleFilter}
            onChange={setScheduleFilter}
            options={filterOptions.schedules.map((s) => ({
              value: s.id,
              label: s.name,
            }))}
            allLabel="All Schedules"
            icon={<Clock className="h-3.5 w-3.5" />}
          />
          <SelectFilter
            value={busFilter}
            onChange={setBusFilter}
            options={filterOptions.buses.map((b) => ({
              value: b.id,
              label: b.registrationNumber,
            }))}
            allLabel="All Buses"
            icon={<Bus className="h-3.5 w-3.5" />}
          />
          <SelectFilter
            value={permitFilter}
            onChange={setPermitFilter}
            options={filterOptions.permits.map((p) => ({
              value: p.id,
              label: p.permitNumber,
            }))}
            allLabel="All Permits"
            icon={<FileText className="h-3.5 w-3.5" />}
          />
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="appearance-none pl-3 pr-2 py-1.5 text-xs font-medium rounded-lg border bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-400 transition-all duration-150"
            title="From Date"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="appearance-none pl-3 pr-2 py-1.5 text-xs font-medium rounded-lg border bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-400 transition-all duration-150"
            title="To Date"
          />
        </>
      }
      activeChips={chips}
      onClearAllFilters={handleClearAll}
    />
  );
}