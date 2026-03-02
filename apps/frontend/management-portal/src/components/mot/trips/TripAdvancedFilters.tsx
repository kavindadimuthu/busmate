'use client';

import React, { useCallback } from 'react';
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  MapPin,
  Users,
  Bus,
  User,
  Calendar,
  Route,
} from 'lucide-react';
import {
  SearchFilterBar,
  SelectFilter,
} from '@/components/shared/SearchFilterBar';
import type { FilterChipDescriptor } from '@/components/shared/SearchFilterBar';

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
    setStatusFilter('all');
    setRouteFilter('all');
    setOperatorFilter('all');
    setScheduleFilter('all');
    setBusFilter('all');
    setPspFilter('all');
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

  // ── Build active-filter chips ─────────────────────────────────

  const chips: FilterChipDescriptor[] = [];

  if (statusFilter !== 'all') {
    chips.push({
      key: 'status',
      label: STATUS_LABELS[statusFilter] || statusFilter,
      onRemove: () => setStatusFilter('all'),
      colorClass: 'bg-green-50 text-green-700 border-green-200',
      icon: <CheckCircle className="h-3 w-3 opacity-70" />,
    });
  }

  if (routeFilter !== 'all') {
    const routeName = filterOptions.routes.find((r) => r.id === routeFilter)?.name;
    chips.push({
      key: 'route',
      label: `Route: ${routeName || routeFilter}`,
      onRemove: () => setRouteFilter('all'),
      colorClass: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: <Route className="h-3 w-3 opacity-70" />,
    });
  }

  if (operatorFilter !== 'all') {
    const opName = filterOptions.operators.find((o) => o.id === operatorFilter)?.name;
    chips.push({
      key: 'operator',
      label: `Operator: ${opName || operatorFilter}`,
      onRemove: () => setOperatorFilter('all'),
      colorClass: 'bg-orange-50 text-orange-700 border-orange-200',
      icon: <User className="h-3 w-3 opacity-70" />,
    });
  }

  if (scheduleFilter !== 'all') {
    const schName = filterOptions.schedules.find((s) => s.id === scheduleFilter)?.name;
    chips.push({
      key: 'schedule',
      label: `Schedule: ${schName || scheduleFilter}`,
      onRemove: () => setScheduleFilter('all'),
      colorClass: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: <Clock className="h-3 w-3 opacity-70" />,
    });
  }

  if (busFilter !== 'all') {
    const busReg = filterOptions.buses.find((b) => b.id === busFilter)?.registrationNumber;
    chips.push({
      key: 'bus',
      label: `Bus: ${busReg || busFilter}`,
      onRemove: () => setBusFilter('all'),
      colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: <Bus className="h-3 w-3 opacity-70" />,
    });
  }

  if (pspFilter !== 'all') {
    const pspNum = filterOptions.passengerServicePermits.find((p) => p.id === pspFilter)?.permitNumber;
    chips.push({
      key: 'psp',
      label: `PSP: ${pspNum || pspFilter}`,
      onRemove: () => setPspFilter('all'),
      colorClass: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: <Users className="h-3 w-3 opacity-70" />,
    });
  }

  if (fromDate) {
    chips.push({
      key: 'from-date',
      label: `From: ${fromDate}`,
      onRemove: () => setFromDate(''),
      colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: <Calendar className="h-3 w-3 opacity-70" />,
    });
  }

  if (toDate) {
    chips.push({
      key: 'to-date',
      label: `To: ${toDate}`,
      onRemove: () => setToDate(''),
      colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: <Calendar className="h-3 w-3 opacity-70" />,
    });
  }

  if (hasPsp) {
    chips.push({
      key: 'has-psp',
      label: 'Has PSP',
      onRemove: () => setHasPsp(false),
      colorClass: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: <Users className="h-3 w-3 opacity-70" />,
    });
  }

  if (hasBus) {
    chips.push({
      key: 'has-bus',
      label: 'Has Bus',
      onRemove: () => setHasBus(false),
      colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: <Bus className="h-3 w-3 opacity-70" />,
    });
  }

  if (hasDriver) {
    chips.push({
      key: 'has-driver',
      label: 'Has Driver',
      onRemove: () => setHasDriver(false),
      colorClass: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: <User className="h-3 w-3 opacity-70" />,
    });
  }

  if (hasConductor) {
    chips.push({
      key: 'has-conductor',
      label: 'Has Conductor',
      onRemove: () => setHasConductor(false),
      colorClass: 'bg-orange-50 text-orange-700 border-orange-200',
      icon: <User className="h-3 w-3 opacity-70" />,
    });
  }

  return (
    <SearchFilterBar
      searchValue={searchTerm}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Search trips by route name, operator, schedule…"
      totalCount={totalCount}
      filteredCount={filteredCount}
      resultLabel="trip"
      loading={loading}
      filters={
        <>
          {/* Row 1: Primary dropdown filters */}
          <SelectFilter
            value={statusFilter}
            onChange={setStatusFilter}
            options={uniqueOptions(
              filterOptions.statuses.map((s) => ({
                value: s,
                label: STATUS_LABELS[s] || s,
              })),
            )}
            allLabel="All Statuses"
            icon={<AlertCircle className="h-3.5 w-3.5" />}
          />
          <SelectFilter
            value={routeFilter}
            onChange={setRouteFilter}
            options={uniqueOptions(
              filterOptions.routes.map((r) => ({
                value: r.id,
                label: r.routeGroup ? `${r.name} (${r.routeGroup})` : r.name,
              })),
            )}
            allLabel="All Routes"
            icon={<Route className="h-3.5 w-3.5" />}
          />
          <SelectFilter
            value={operatorFilter}
            onChange={setOperatorFilter}
            options={uniqueOptions(
              filterOptions.operators.map((o) => ({
                value: o.id,
                label: o.name,
              })),
            )}
            allLabel="All Operators"
            icon={<User className="h-3.5 w-3.5" />}
          />
          <SelectFilter
            value={scheduleFilter}
            onChange={setScheduleFilter}
            options={uniqueOptions(
              filterOptions.schedules.map((s) => ({
                value: s.id,
                label: s.name,
              })),
            )}
            allLabel="All Schedules"
            icon={<Clock className="h-3.5 w-3.5" />}
          />
          <SelectFilter
            value={busFilter}
            onChange={setBusFilter}
            options={uniqueOptions(
              filterOptions.buses.map((b) => ({
                value: b.id,
                label: b.registrationNumber,
              })),
            )}
            allLabel="All Buses"
            icon={<Bus className="h-3.5 w-3.5" />}
          />
          <SelectFilter
            value={pspFilter}
            onChange={setPspFilter}
            options={uniqueOptions(
              filterOptions.passengerServicePermits.map((p) => ({
                value: p.id,
                label: p.permitNumber,
              })),
            )}
            allLabel="All PSPs"
            icon={<Users className="h-3.5 w-3.5" />}
          />

          {/* Date range inputs */}
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="appearance-none pl-3 pr-2 py-1.5 text-xs font-medium rounded-lg border bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-400 transition-all duration-150"
            placeholder="From Date"
            title="From Date"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="appearance-none pl-3 pr-2 py-1.5 text-xs font-medium rounded-lg border bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-400 transition-all duration-150"
            placeholder="To Date"
            title="To Date"
          />

          {/* Assignment toggle buttons */}
          <button
            type="button"
            onClick={() => setHasPsp(!hasPsp)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 whitespace-nowrap ${
              hasPsp
                ? 'bg-purple-50 border-purple-300 text-purple-800'
                : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-white'
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
                ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-white'
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
                ? 'bg-blue-50 border-blue-300 text-blue-800'
                : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-white'
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
                ? 'bg-orange-50 border-orange-300 text-orange-800'
                : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-white'
            }`}
          >
            <User className="h-3 w-3" />
            Conductor
          </button>
        </>
      }
      activeChips={chips}
      onClearAllFilters={handleClearAll}
    />
  );
}
