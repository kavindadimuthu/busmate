"use client";

import * as React from "react";
import { FilterBar, FilterSelect } from "@busmate/ui";
import { Route as RouteIcon } from "lucide-react";

export interface ScheduleFilters {
  status: string;
  scheduleType: string;
  routeId: string;
  effectiveStartDate: string;
  effectiveEndDate: string;
}

interface FilterOptions {
  statuses: string[];
  scheduleTypes: string[];
  routes: Array<{ id: string; name: string; routeGroup?: string }>;
}

interface SchedulesFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: ScheduleFilters;
  onFiltersChange: (filters: Partial<ScheduleFilters>) => void;
  onClearAll: () => void;
  filterOptions: FilterOptions;
  activeFilterCount?: number;
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  PENDING: "Pending",
  CANCELLED: "Cancelled",
};

const TYPE_LABELS: Record<string, string> = {
  REGULAR: "Regular",
  SPECIAL: "Special",
};

export function SchedulesFilterBar({
  searchValue,
  onSearchChange,
  filters,
  onFiltersChange,
  onClearAll,
  filterOptions,
  activeFilterCount = 0,
}: SchedulesFilterBarProps) {
  const statusOptions = (filterOptions.statuses || []).map((s) => ({
    value: s,
    label: STATUS_LABELS[s] ?? s.charAt(0) + s.slice(1).toLowerCase(),
  }));

  const typeOptions = (filterOptions.scheduleTypes || []).map((t) => ({
    value: t,
    label: TYPE_LABELS[t] ?? t,
  }));

  const routeOptions = (filterOptions.routes || []).map((r) => ({
    value: r.id,
    label: r.routeGroup ? `${r.name} (${r.routeGroup})` : r.name,
  }));

  return (
    <FilterBar
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search schedules by name, route, or description…"
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
        label="Type"
        value={filters.scheduleType ?? "__all__"}
        onChange={(value) => onFiltersChange({ scheduleType: value })}
        options={typeOptions}
        placeholder="All Types"
        className="w-32"
      />
      <FilterSelect
        label="Route"
        value={filters.routeId ?? "__all__"}
        onChange={(value) => onFiltersChange({ routeId: value })}
        options={routeOptions}
        placeholder="All Routes"
        className="w-44"
      />
      <input
        type="date"
        value={filters.effectiveStartDate ?? ""}
        onChange={(e) => onFiltersChange({ effectiveStartDate: e.target.value })}
        className="h-9 px-3 text-xs font-medium rounded-md border bg-background text-foreground hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25 transition-all"
        title="Effective from"
      />
      <input
        type="date"
        value={filters.effectiveEndDate ?? ""}
        onChange={(e) => onFiltersChange({ effectiveEndDate: e.target.value })}
        className="h-9 px-3 text-xs font-medium rounded-md border bg-background text-foreground hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25 transition-all"
        title="Effective to"
      />
    </FilterBar>
  );
}
