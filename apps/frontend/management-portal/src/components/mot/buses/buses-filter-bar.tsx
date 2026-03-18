"use client";

import * as React from "react";
import { FilterBar, FilterSelect } from "@busmate/ui";

export interface BusFilters {
  status: string;
  operatorId: string;
  model: string;
}

interface FilterOptions {
  statuses: string[];
  operators: Array<{ id: string; name: string }>;
  models: string[];
}

interface BusesFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: BusFilters;
  onFiltersChange: (filters: Partial<BusFilters>) => void;
  onClearAll: () => void;
  filterOptions: FilterOptions;
  activeFilterCount?: number;
}

export function BusesFilterBar({
  searchValue,
  onSearchChange,
  filters,
  onFiltersChange,
  onClearAll,
  filterOptions,
  activeFilterCount = 0,
}: BusesFilterBarProps) {
  const statusOptions = (filterOptions.statuses || []).map((s) => ({
    value: s,
    label: s.charAt(0) + s.slice(1).toLowerCase(),
  }));

  const operatorOptions = (filterOptions.operators || []).map((op) => ({
    value: op.id,
    label: op.name,
  }));

  const modelOptions = (filterOptions.models || []).map((m) => ({
    value: m,
    label: m,
  }));

  return (
    <FilterBar
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search by registration, plate number, model, or operator…"
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
        label="Model"
        value={filters.model ?? "__all__"}
        onChange={(value) => onFiltersChange({ model: value })}
        options={modelOptions}
        placeholder="All Models"
        className="w-40"
      />
    </FilterBar>
  );
}
