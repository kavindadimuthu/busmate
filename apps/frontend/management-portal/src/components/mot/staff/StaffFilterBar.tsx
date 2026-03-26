"use client";

import * as React from "react";
import { FilterBar, FilterSelect } from "@busmate/ui";

export interface StaffFilters {
  status: string;
  province: string;
}

interface StaffFilterOptions {
  statuses: string[];
  provinces: string[];
}

interface StaffFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: StaffFilters;
  onFiltersChange: (filters: Partial<StaffFilters>) => void;
  onClearAll: () => void;
  filterOptions: StaffFilterOptions;
  activeFilterCount?: number;
}

export function StaffFilterBar({
  searchValue,
  onSearchChange,
  filters,
  onFiltersChange,
  onClearAll,
  filterOptions,
  activeFilterCount = 0,
}: StaffFilterBarProps) {
  const statusOptions = (filterOptions.statuses || []).map((s) => ({
    value: s,
    label: s.charAt(0).toUpperCase() + s.slice(1),
  }));

  const provinceOptions = (filterOptions.provinces || []).map((p) => ({
    value: p,
    label: p,
  }));

  return (
    <FilterBar
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search staff by name, email, NIC…"
      activeFilterCount={activeFilterCount}
      onClearAll={onClearAll}
    >
      <FilterSelect
        label="Status"
        value={filters.status ?? "__all__"}
        onChange={(value) => onFiltersChange({ status: value })}
        options={statusOptions}
        placeholder="All Statuses"
        className="w-40"
      />
      <FilterSelect
        label="Province"
        value={filters.province ?? "__all__"}
        onChange={(value) => onFiltersChange({ province: value })}
        options={provinceOptions}
        placeholder="All Provinces"
        className="w-44"
      />
    </FilterBar>
  );
}
