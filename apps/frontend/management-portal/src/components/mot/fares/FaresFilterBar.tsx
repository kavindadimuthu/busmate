"use client";

import * as React from "react";
import { FilterBar, FilterSelect } from "@busmate/ui";

export interface FaresAmendmentFilters {
  status: string;
}

interface FaresFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: FaresAmendmentFilters;
  onFiltersChange: (filters: Partial<FaresAmendmentFilters>) => void;
  onClearAll: () => void;
  statusOptions: string[];
  activeFilterCount?: number;
}

export function FaresFilterBar({
  searchValue,
  onSearchChange,
  filters,
  onFiltersChange,
  onClearAll,
  statusOptions,
  activeFilterCount = 0,
}: FaresFilterBarProps) {
  const options = (statusOptions || []).map((s) => ({ value: s, label: s }));

  return (
    <FilterBar
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search by reference, title, or gazette number…"
      activeFilterCount={activeFilterCount}
      onClearAll={onClearAll}
    >
      <FilterSelect
        label="Status"
        value={filters.status ?? "__all__"}
        onChange={(value) => onFiltersChange({ status: value })}
        options={options}
        placeholder="All Statuses"
      />
    </FilterBar>
  );
}
