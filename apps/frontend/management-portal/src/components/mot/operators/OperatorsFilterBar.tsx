"use client";

import * as React from "react";
import { FilterBar, FilterSelect } from "@busmate/ui";

// ── Types ─────────────────────────────────────────────────────────

export interface OperatorFilters {
  status: string;
  operatorType: string;
  region: string;
}

interface FilterOptions {
  regions: string[];
}

interface OperatorsFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: OperatorFilters;
  onFiltersChange: (filters: Partial<OperatorFilters>) => void;
  onClearAll: () => void;
  filterOptions: FilterOptions;
  activeFilterCount?: number;
}

// ── Constants ─────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
  { value: "cancelled", label: "Cancelled" },
];

const TYPE_OPTIONS = [
  { value: "PRIVATE", label: "Private" },
  { value: "CTB", label: "CTB" },
];

// ── Component ─────────────────────────────────────────────────────

/**
 * Operators search & filter bar.
 *
 * Composes the shared `FilterBar` pattern with operator-specific
 * filter controls: status, operator type, and region dropdowns.
 */
export function OperatorsFilterBar({
  searchValue,
  onSearchChange,
  filters,
  onFiltersChange,
  onClearAll,
  filterOptions,
  activeFilterCount = 0,
}: OperatorsFilterBarProps) {
  const regionOptions = filterOptions.regions
    .filter((r) => r && r.trim() !== "")
    .map((r) => ({ value: r, label: r }));

  return (
    <FilterBar
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search operators by name or region…"
      activeFilterCount={activeFilterCount}
      onClearAll={onClearAll}
    >
      <FilterSelect
        label="Statuses"
        value={filters.status ?? "__all__"}
        onChange={(value) => onFiltersChange({ status: value })}
        options={STATUS_OPTIONS}
        placeholder="All Statuses"
        className="w-40"
      />
      <FilterSelect
        label="Types"
        value={filters.operatorType ?? "__all__"}
        onChange={(value) => onFiltersChange({ operatorType: value })}
        options={TYPE_OPTIONS}
        placeholder="All Types"
        className="w-36"
      />
      <FilterSelect
        label="Regions"
        value={filters.region ?? "__all__"}
        onChange={(value) => onFiltersChange({ region: value })}
        options={regionOptions}
        placeholder="All Regions"
        className="w-44"
      />
    </FilterBar>
  );
}
