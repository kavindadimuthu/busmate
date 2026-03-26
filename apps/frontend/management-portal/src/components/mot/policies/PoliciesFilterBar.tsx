'use client';

import * as React from 'react';
import { FilterBar, FilterSelect } from '@busmate/ui';

export interface PolicyFiltersState {
  status: string;
  type: string;
  department: string;
  priority: string;
}

interface PolicyFilterOptions {
  statuses: string[];
  types: string[];
  departments: string[];
  priorities: string[];
}

interface PoliciesFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: PolicyFiltersState;
  onFiltersChange: (filters: Partial<PolicyFiltersState>) => void;
  onClearAll: () => void;
  filterOptions: PolicyFilterOptions;
  activeFilterCount?: number;
}

export function PoliciesFilterBar({
  searchValue,
  onSearchChange,
  filters,
  onFiltersChange,
  onClearAll,
  filterOptions,
  activeFilterCount = 0,
}: PoliciesFilterBarProps) {
  return (
    <FilterBar
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search policies by title, type, author…"
      activeFilterCount={activeFilterCount}
      onClearAll={onClearAll}
    >
      <FilterSelect
        label="Status"
        value={filters.status ?? '__all__'}
        onChange={(value) => onFiltersChange({ status: value })}
        options={filterOptions.statuses.map((s) => ({ value: s, label: s }))}
        placeholder="All Status"
      />
      <FilterSelect
        label="Type"
        value={filters.type ?? '__all__'}
        onChange={(value) => onFiltersChange({ type: value })}
        options={filterOptions.types.map((t) => ({ value: t, label: t }))}
        placeholder="All Types"
      />
      <FilterSelect
        label="Department"
        value={filters.department ?? '__all__'}
        onChange={(value) => onFiltersChange({ department: value })}
        options={filterOptions.departments.map((d) => ({ value: d, label: d }))}
        placeholder="All Departments"
      />
      <FilterSelect
        label="Priority"
        value={filters.priority ?? '__all__'}
        onChange={(value) => onFiltersChange({ priority: value })}
        options={filterOptions.priorities.map((p) => ({ value: p, label: p }))}
        placeholder="All Priorities"
      />
    </FilterBar>
  );
}
