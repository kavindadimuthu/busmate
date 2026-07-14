"use client";

import * as React from "react";
import { FilterBar, FilterSelect } from "@busmate/ui";
import type { FleetFilters, BusStatus } from "@/hooks/operator/fleet/useFleetManagement";

// ── Types ─────────────────────────────────────────────────────────

interface FleetFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: FleetFilters;
  onFiltersChange: (filters: Partial<FleetFilters>) => void;
  onClearAll: () => void;
  activeFilterCount?: number;
}

// ── Filter options ────────────────────────────────────────────────
// Matches core-service's real Bus.status check constraint exactly (pending/active/inactive/cancelled).

const STATUS_OPTIONS: { value: BusStatus; label: string }[] = [
  { value: "active",   label: "Active"   },
  { value: "inactive", label: "Inactive" },
  { value: "pending",  label: "Pending"  },
  { value: "cancelled", label: "Cancelled" },
];

// ── Component ─────────────────────────────────────────────────────

/**
 * Fleet search & filter bar — status only (no service-type filter, since core-service's
 * Bus entity has no such field).
 */
export function FleetFilterBar({
  searchValue,
  onSearchChange,
  filters,
  onFiltersChange,
  onClearAll,
  activeFilterCount = 0,
}: FleetFilterBarProps) {
  return (
    <FilterBar
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search by plate number or NTC registration number…"
      activeFilterCount={activeFilterCount}
      onClearAll={activeFilterCount > 0 ? onClearAll : undefined}
    >
      <FilterSelect
        label="Status"
        value={filters.status === "__all__" ? "__all__" : filters.status}
        onChange={(value) =>
          onFiltersChange({ status: value as BusStatus | "__all__" })
        }
        options={STATUS_OPTIONS}
        placeholder="All Statuses"
        className="w-40"
      />
    </FilterBar>
  );
}
