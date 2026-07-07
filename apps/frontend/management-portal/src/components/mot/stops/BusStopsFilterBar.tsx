"use client";

import * as React from "react";
import { FilterBar, FilterSelect } from "@busmate/ui";

export interface BusStopFilters {
  state: string;
  accessibility: string;
}

// ── Filter option types ───────────────────────────────────────────

interface FilterOptions {
  states: string[];
}

interface BusStopsFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: BusStopFilters;
  onFiltersChange: (filters: Partial<BusStopFilters>) => void;
  onClearAll: () => void;
  filterOptions: FilterOptions;
  activeFilterCount?: number;
}

// ── Component ─────────────────────────────────────────────────────

/**
 * Bus-stop search & filter bar.
 *
 * Composes the shared `FilterBar` pattern with bus-stop-specific
 * filter controls: state dropdown and accessibility filter.
 */
export function BusStopsFilterBar({
  searchValue,
  onSearchChange,
  filters,
  onFiltersChange,
  onClearAll,
  filterOptions,
  activeFilterCount = 0,
}: BusStopsFilterBarProps) {
  const accessibilityOptions = [
    { value: "accessible", label: "Accessible" },
    { value: "non-accessible", label: "Not Accessible" },
  ];

  return (
    <FilterBar
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search bus stops by name, city, or state…"
      activeFilterCount={activeFilterCount}
      onClearAll={onClearAll}
    >
      <FilterSelect
        label="States"
        value={filters.state ?? "__all__"}
        onChange={(value) => onFiltersChange({ state: value })}
        options={filterOptions.states.filter((s) => s && s.trim() !== '').map((s) => ({ value: s, label: s }))}
        placeholder="All States"
        className="w-40"
      />
      <FilterSelect
        label="Accessibility"
        value={filters.accessibility ?? "__all__"}
        onChange={(value) => onFiltersChange({ accessibility: value })}
        options={accessibilityOptions}
        placeholder="All"
        className="w-44"
      />
    </FilterBar>
  );
}
