"use client";

import * as React from "react";
import { FilterBar, FilterSelect } from "@busmate/ui";
import type { CrewFilters } from "@/hooks/operator/crew/useCrewManagement";
import type { AccountStatus } from "@/lib/api/adminUsers";

interface CrewFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: CrewFilters;
  onFiltersChange: (filters: Partial<CrewFilters>) => void;
  onClearAll: () => void;
  activeFilterCount?: number;
}

const STATUS_OPTIONS: { value: AccountStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
];

export function CrewFilterBar({
  searchValue,
  onSearchChange,
  filters,
  onFiltersChange,
  onClearAll,
  activeFilterCount = 0,
}: CrewFilterBarProps) {
  return (
    <FilterBar
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search by name, email, or username…"
      activeFilterCount={activeFilterCount}
      onClearAll={activeFilterCount > 0 ? onClearAll : undefined}
    >
      <FilterSelect
        label="Status"
        value={filters.status === "__all__" ? "__all__" : filters.status}
        onChange={(value) => onFiltersChange({ status: value as AccountStatus | "__all__" })}
        options={STATUS_OPTIONS}
        placeholder="All Statuses"
        className="w-40"
      />
    </FilterBar>
  );
}
