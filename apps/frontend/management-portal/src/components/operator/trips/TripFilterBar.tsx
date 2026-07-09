"use client";

import * as React from "react";
import { FilterBar, FilterSelect } from "@busmate/ui";
import type { TripFilters, TripStatus } from "@/hooks/operator/trips/useTripsManagement";

interface TripFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: TripFilters;
  onFiltersChange: (filters: Partial<TripFilters>) => void;
  onClearAll: () => void;
  activeFilterCount?: number;
}

// Matches core-service's real TripStatusEnum exactly.
const STATUS_OPTIONS: { value: TripStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "boarding", label: "Boarding" },
  { value: "in_transit", label: "In Transit" },
  { value: "departed", label: "Departed" },
  { value: "delayed", label: "Delayed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function TripFilterBar({
  searchValue,
  onSearchChange,
  filters,
  onFiltersChange,
  onClearAll,
  activeFilterCount = 0,
}: TripFilterBarProps) {
  return (
    <FilterBar
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search by route, permit, or bus plate number…"
      activeFilterCount={activeFilterCount}
      onClearAll={activeFilterCount > 0 ? onClearAll : undefined}
    >
      <FilterSelect
        label="Status"
        value={filters.status === "__all__" ? "__all__" : filters.status}
        onChange={(value) => onFiltersChange({ status: value as TripStatus | "__all__" })}
        options={STATUS_OPTIONS}
        placeholder="All Statuses"
        className="w-40"
      />
    </FilterBar>
  );
}
