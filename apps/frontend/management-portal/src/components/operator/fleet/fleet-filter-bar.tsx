"use client";

import * as React from "react";
import { FilterBar, FilterSelect } from "@busmate/ui";
import type { BusStatus, BusServiceType } from "@/data/operator/buses";

// ── Types ─────────────────────────────────────────────────────────

export interface FleetFilters {
  status: BusStatus | "__all__";
  serviceType: BusServiceType | "__all__";
}

interface FleetFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: FleetFilters;
  onFiltersChange: (filters: Partial<FleetFilters>) => void;
  onClearAll: () => void;
  activeFilterCount?: number;
}

// ── Filter options ────────────────────────────────────────────────

const STATUS_OPTIONS: { value: BusStatus; label: string }[] = [
  { value: "ACTIVE",      label: "Active"      },
  { value: "INACTIVE",    label: "Inactive"    },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "RETIRED",     label: "Retired"     },
];

const SERVICE_TYPE_OPTIONS: { value: BusServiceType; label: string }[] = [
  { value: "SL",          label: "SL (Normal)" },
  { value: "SL_AC",       label: "SL A/C"      },
  { value: "SEMI_LUXURY", label: "Semi-Luxury" },
  { value: "LUXURY",      label: "Luxury"      },
  { value: "EXPRESS",     label: "Express"     },
];

// ── Component ─────────────────────────────────────────────────────

/**
 * Fleet search & filter bar.
 *
 * Composes the shared `FilterBar` pattern with bus-specific filters:
 * status and service type dropdowns.
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
      searchPlaceholder="Search by plate number, model, driver, route…"
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
      <FilterSelect
        label="Service Type"
        value={filters.serviceType === "__all__" ? "__all__" : filters.serviceType}
        onChange={(value) =>
          onFiltersChange({ serviceType: value as BusServiceType | "__all__" })
        }
        options={SERVICE_TYPE_OPTIONS}
        placeholder="All Types"
        className="w-44"
      />
    </FilterBar>
  );
}
