'use client';

import { useCallback } from 'react';
import { Users, Bus, User } from 'lucide-react';
import { FilterBar, FilterSelect } from '@busmate/ui';

// ── Types ─────────────────────────────────────────────────────────

interface FilterOptions {
  statuses: Array<'pending' | 'active' | 'completed' | 'cancelled' | 'delayed' | 'in_transit' | 'boarding' | 'departed'>;
  routes: Array<{ id: string; name: string; routeGroup?: string }>;
  operators: Array<{ id: string; name: string }>;
  schedules: Array<{ id: string; name: string }>;
  buses: Array<{ id: string; registrationNumber: string }>;
  passengerServicePermits: Array<{ id: string; permitNumber: string }>;
}

interface TripAdvancedFiltersProps {
  // Search
  searchTerm: string;
  setSearchTerm: (value: string) => void;

  // Filters
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  routeFilter: string;
  setRouteFilter: (value: string) => void;
  operatorFilter: string;
  setOperatorFilter: (value: string) => void;
  scheduleFilter: string;
  setScheduleFilter: (value: string) => void;
  busFilter: string;
  setBusFilter: (value: string) => void;
  pspFilter: string;
  setPspFilter: (value: string) => void;
  fromDate: string;
  setFromDate: (value: string) => void;
  toDate: string;
  setToDate: (value: string) => void;
  hasPsp: boolean;
  setHasPsp: (value: boolean) => void;
  hasBus: boolean;
  setHasBus: (value: boolean) => void;
  hasDriver: boolean;
  setHasDriver: (value: boolean) => void;
  hasConductor: boolean;
  setHasConductor: (value: boolean) => void;

  // Data
  filterOptions: FilterOptions;
  loading: boolean;

  // Stats
  totalCount?: number;
  filteredCount?: number;

  // Events
  onClearAll?: () => void;
  onSearch?: (term: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  pending: 'Pending',
  cancelled: 'Cancelled',
  delayed: 'Delayed',
  in_transit: 'In Transit',
  boarding: 'Boarding',
  departed: 'Departed',
};

// ── Component ─────────────────────────────────────────────────────

// remove duplicate option entries (by value) before rendering select lists
function uniqueOptions<T extends { value: string }>(options: T[]): T[] {
  const seen = new Set<string>();
  return options.filter((opt) => {
    if (seen.has(opt.value)) return false;
    seen.add(opt.value);
    return true;
  });
}

export default function TripAdvancedFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  routeFilter,
  setRouteFilter,
  operatorFilter,
  setOperatorFilter,
  scheduleFilter,
  setScheduleFilter,
  busFilter,
  setBusFilter,
  pspFilter,
  setPspFilter,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  hasPsp,
  setHasPsp,
  hasBus,
  setHasBus,
  hasDriver,
  setHasDriver,
  hasConductor,
  setHasConductor,
  filterOptions,
  loading,
  totalCount = 0,
  filteredCount = 0,
  onClearAll,
  onSearch,
}: TripAdvancedFiltersProps) {
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
    setOperatorFilter('__all__');
    setScheduleFilter('__all__');
    setBusFilter('__all__');
    setPspFilter('__all__');
    setFromDate('');
    setToDate('');
    setHasPsp(false);
    setHasBus(false);
    setHasDriver(false);
    setHasConductor(false);
    onClearAll?.();
  }, [
    setSearchTerm, setStatusFilter, setRouteFilter, setOperatorFilter,
    setScheduleFilter, setBusFilter, setPspFilter, setFromDate, setToDate,
    setHasPsp, setHasBus, setHasDriver, setHasConductor, onClearAll,
  ]);

  const activeFilterCount = [statusFilter, routeFilter, operatorFilter, scheduleFilter, busFilter, pspFilter].filter(v => v !== '__all__').length
    + [fromDate, toDate].filter(Boolean).length
    + [hasPsp, hasBus, hasDriver, hasConductor].filter(Boolean).length;

  return (
    <FilterBar
      searchValue={searchTerm}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Search trips by route name, operator, schedule…"
      activeFilterCount={activeFilterCount}
      onClearAll={handleClearAll}
    >
      {/* Row 1: Primary dropdown filters */}
      <FilterSelect
        label="Statuses"
        value={statusFilter}
        onChange={setStatusFilter}
        options={uniqueOptions(
          filterOptions.statuses.map((s) => ({
            value: s,
            label: STATUS_LABELS[s] || s,
          })),
        )}
      />
      <FilterSelect
        label="Routes"
        value={routeFilter}
        onChange={setRouteFilter}
        options={uniqueOptions(
          filterOptions.routes.map((r) => ({
            value: r.id,
            label: r.routeGroup ? `${r.name} (${r.routeGroup})` : r.name,
          })),
        )}
      />
      <FilterSelect
        label="Operators"
        value={operatorFilter}
        onChange={setOperatorFilter}
        options={uniqueOptions(
          filterOptions.operators.map((o) => ({
            value: o.id,
            label: o.name,
          })),
        )}
      />
      <FilterSelect
        label="Schedules"
        value={scheduleFilter}
        onChange={setScheduleFilter}
        options={uniqueOptions(
          filterOptions.schedules.map((s) => ({
            value: s.id,
            label: s.name,
          })),
        )}
      />
      <FilterSelect
        label="Buses"
        value={busFilter}
        onChange={setBusFilter}
        options={uniqueOptions(
          filterOptions.buses.map((b) => ({
            value: b.id,
            label: b.registrationNumber,
          })),
        )}
      />
      <FilterSelect
        label="PSPs"
        value={pspFilter}
        onChange={setPspFilter}
        options={uniqueOptions(
          filterOptions.passengerServicePermits.map((p) => ({
            value: p.id,
            label: p.permitNumber,
          })),
        )}
      />

      {/* Date range inputs */}
      <input
        type="date"
        value={fromDate}
        onChange={(e) => setFromDate(e.target.value)}
        className="appearance-none pl-3 pr-2 py-1.5 text-xs font-medium rounded-lg border bg-muted border-border text-muted-foreground hover:border-border hover:bg-card focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-400 transition-all duration-150"
        placeholder="From Date"
        title="From Date"
      />
      <input
        type="date"
        value={toDate}
        onChange={(e) => setToDate(e.target.value)}
        className="appearance-none pl-3 pr-2 py-1.5 text-xs font-medium rounded-lg border bg-muted border-border text-muted-foreground hover:border-border hover:bg-card focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-400 transition-all duration-150"
        placeholder="To Date"
        title="To Date"
      />

      {/* Assignment toggle buttons */}
      <button
        type="button"
        onClick={() => setHasPsp(!hasPsp)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 whitespace-nowrap ${
          hasPsp
            ? 'bg-[hsl(var(--purple-50))] border-purple-300 text-[hsl(var(--purple-800))]'
            : 'bg-muted border-border text-muted-foreground hover:border-border hover:bg-card'
        }`}
      >
        <Users className="h-3 w-3" />
        PSP
      </button>
      <button
        type="button"
        onClick={() => setHasBus(!hasBus)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 whitespace-nowrap ${
          hasBus
            ? 'bg-primary/10 border-indigo-300 text-indigo-800'
            : 'bg-muted border-border text-muted-foreground hover:border-border hover:bg-card'
        }`}
      >
        <Bus className="h-3 w-3" />
        Bus
      </button>
      <button
        type="button"
        onClick={() => setHasDriver(!hasDriver)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 whitespace-nowrap ${
          hasDriver
            ? 'bg-primary/10 border-primary/30 text-primary'
            : 'bg-muted border-border text-muted-foreground hover:border-border hover:bg-card'
        }`}
      >
        <User className="h-3 w-3" />
        Driver
      </button>
      <button
        type="button"
        onClick={() => setHasConductor(!hasConductor)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 whitespace-nowrap ${
          hasConductor
            ? 'bg-warning/10 border-orange-300 text-warning'
            : 'bg-muted border-border text-muted-foreground hover:border-border hover:bg-card'
        }`}
      >
        <User className="h-3 w-3" />
        Conductor
      </button>
    </FilterBar>
  );
}
