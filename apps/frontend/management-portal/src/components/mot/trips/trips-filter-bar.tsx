"use client";

import * as React from "react";
import { FilterBar, FilterSelect } from "@busmate/ui";
import {
  AlertCircle,
  Clock,
  Users,
  Bus,
  User,
  Route,
} from "lucide-react";

export interface TripFilters {
  status: string;
  routeId: string;
  operatorId: string;
  scheduleId: string;
  busId: string;
  pspId: string;
  fromDate: string;
  toDate: string;
  hasPsp: string;
  hasBus: string;
  hasDriver: string;
  hasConductor: string;
}

interface FilterOptions {
  statuses: string[];
  routes: Array<{ id: string; name: string; routeGroup?: string }>;
  operators: Array<{ id: string; name: string }>;
  schedules: Array<{ id: string; name: string }>;
  buses: Array<{ id: string; registrationNumber: string }>;
  passengerServicePermits: Array<{ id: string; permitNumber: string }>;
}

interface TripsFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: TripFilters;
  onFiltersChange: (filters: Partial<TripFilters>) => void;
  onClearAll: () => void;
  filterOptions: FilterOptions;
  activeFilterCount?: number;
}

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  completed: "Completed",
  pending: "Pending",
  cancelled: "Cancelled",
  delayed: "Delayed",
  in_transit: "In Transit",
  boarding: "Boarding",
  departed: "Departed",
};

export function TripsFilterBar({
  searchValue,
  onSearchChange,
  filters,
  onFiltersChange,
  onClearAll,
  filterOptions,
  activeFilterCount = 0,
}: TripsFilterBarProps) {
  const statusOptions = (filterOptions.statuses || []).map((s) => ({
    value: s,
    label: STATUS_LABELS[s] ?? s,
  }));

  const routeOptions = (filterOptions.routes || []).map((r) => ({
    value: r.id,
    label: r.routeGroup ? `${r.name} (${r.routeGroup})` : r.name,
  }));

  const operatorOptions = (filterOptions.operators || []).map((o) => ({
    value: o.id,
    label: o.name,
  }));

  const scheduleOptions = (filterOptions.schedules || []).map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const busOptions = (filterOptions.buses || []).map((b) => ({
    value: b.id,
    label: b.registrationNumber,
  }));

  const pspOptions = Array.from(
    new Map(
      (filterOptions.passengerServicePermits || []).map((p) => [p.id, { value: p.id, label: p.permitNumber }])
    ).values()
  );

  const booleanOptions = [
    { value: "true", label: "Yes" },
    { value: "false", label: "No" },
  ];

  return (
    <FilterBar
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search trips by route name, operator, schedule…"
      activeFilterCount={activeFilterCount}
      onClearAll={onClearAll}
    >
      <FilterSelect
        label="Status"
        value={filters.status ?? "__all__"}
        onChange={(value) => onFiltersChange({ status: value })}
        options={statusOptions}
        placeholder="All Statuses"
        className="w-36"
      />
      <FilterSelect
        label="Route"
        value={filters.routeId ?? "__all__"}
        onChange={(value) => onFiltersChange({ routeId: value })}
        options={routeOptions}
        placeholder="All Routes"
        className="w-40"
      />
      <FilterSelect
        label="Operator"
        value={filters.operatorId ?? "__all__"}
        onChange={(value) => onFiltersChange({ operatorId: value })}
        options={operatorOptions}
        placeholder="All Operators"
        className="w-40"
      />
      <FilterSelect
        label="Schedule"
        value={filters.scheduleId ?? "__all__"}
        onChange={(value) => onFiltersChange({ scheduleId: value })}
        options={scheduleOptions}
        placeholder="All Schedules"
        className="w-40"
      />
      <FilterSelect
        label="Bus"
        value={filters.busId ?? "__all__"}
        onChange={(value) => onFiltersChange({ busId: value })}
        options={busOptions}
        placeholder="All Buses"
        className="w-36"
      />
      <FilterSelect
        label="PSP"
        value={filters.pspId ?? "__all__"}
        onChange={(value) => onFiltersChange({ pspId: value })}
        options={pspOptions}
        placeholder="All PSPs"
        className="w-36"
      />
      <FilterSelect
        label="Has PSP"
        value={filters.hasPsp ?? "__all__"}
        onChange={(value) => onFiltersChange({ hasPsp: value })}
        options={booleanOptions}
        placeholder="Any"
        className="w-28"
      />
      <FilterSelect
        label="Has Bus"
        value={filters.hasBus ?? "__all__"}
        onChange={(value) => onFiltersChange({ hasBus: value })}
        options={booleanOptions}
        placeholder="Any"
        className="w-28"
      />
      <FilterSelect
        label="Has Driver"
        value={filters.hasDriver ?? "__all__"}
        onChange={(value) => onFiltersChange({ hasDriver: value })}
        options={booleanOptions}
        placeholder="Any"
        className="w-32"
      />
      <FilterSelect
        label="Has Conductor"
        value={filters.hasConductor ?? "__all__"}
        onChange={(value) => onFiltersChange({ hasConductor: value })}
        options={booleanOptions}
        placeholder="Any"
        className="w-36"
      />
      <input
        type="date"
        value={filters.fromDate ?? ""}
        onChange={(e) => onFiltersChange({ fromDate: e.target.value })}
        className="h-9 px-3 text-xs font-medium rounded-md border bg-background text-foreground hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25 transition-all"
        title="From Date"
      />
      <input
        type="date"
        value={filters.toDate ?? ""}
        onChange={(e) => onFiltersChange({ toDate: e.target.value })}
        className="h-9 px-3 text-xs font-medium rounded-md border bg-background text-foreground hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25 transition-all"
        title="To Date"
      />
    </FilterBar>
  );
}
