"use client";

import * as React from "react";
import { FilterBar, FilterSelect } from "@busmate/ui";

export interface PermitFilters {
  status: string;
  operatorId: string;
  routeGroupId: string;
  permitType: string;
}

interface FilterOptions {
  statuses: string[];
  operators: Array<{ id: string; name: string }>;
  routeGroups: Array<{ id: string; name: string }>;
  permitTypes: string[];
}

interface PermitsFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: PermitFilters;
  onFiltersChange: (filters: Partial<PermitFilters>) => void;
  onClearAll: () => void;
  filterOptions: FilterOptions;
  activeFilterCount?: number;
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  PENDING: "Pending",
  EXPIRED: "Expired",
};

export function PermitsFilterBar({
  searchValue,
  onSearchChange,
  filters,
  onFiltersChange,
  onClearAll,
  filterOptions,
  activeFilterCount = 0,
}: PermitsFilterBarProps) {
  const statusOptions = (filterOptions.statuses || []).map((s) => ({
    value: s,
    label: STATUS_LABELS[s] ?? s.charAt(0) + s.slice(1).toLowerCase(),
  }));

  const operatorOptions = (filterOptions.operators || []).map((op) => ({
    value: op.id,
    label: op.name,
  }));

  const routeGroupOptions = (filterOptions.routeGroups || []).map((rg) => ({
    value: rg.id,
    label: rg.name,
  }));

  const permitTypeOptions = (filterOptions.permitTypes || []).map((t) => ({
    value: t,
    label: t,
  }));

  return (
    <FilterBar
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search by permit number, operator, or route group…"
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
        label="Operator"
        value={filters.operatorId ?? "__all__"}
        onChange={(value) => onFiltersChange({ operatorId: value })}
        options={operatorOptions}
        placeholder="All Operators"
        className="w-44"
      />
      <FilterSelect
        label="Route Group"
        value={filters.routeGroupId ?? "__all__"}
        onChange={(value) => onFiltersChange({ routeGroupId: value })}
        options={routeGroupOptions}
        placeholder="All Route Groups"
        className="w-44"
      />
      <FilterSelect
        label="Permit Type"
        value={filters.permitType ?? "__all__"}
        onChange={(value) => onFiltersChange({ permitType: value })}
        options={permitTypeOptions}
        placeholder="All Types"
        className="w-40"
      />
    </FilterBar>
  );
}
