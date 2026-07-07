'use client';

import React, { useCallback } from 'react';
import { FilterBar, FilterSelect } from '@busmate/ui';

// ── Types ─────────────────────────────────────────────────────────

interface FilterOptions {
  statuses: Array<string>;
  operators: Array<{ id: string; name: string; operatorType?: string }>;
  routeGroups: Array<{ id: string; name: string; code?: string }>;
  permitTypes: Array<string>;
}

interface PermitAdvancedFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  operatorFilter: string;
  setOperatorFilter: (value: string) => void;
  routeGroupFilter: string;
  setRouteGroupFilter: (value: string) => void;
  permitTypeFilter: string;
  setPermitTypeFilter: (value: string) => void;
  filterOptions: FilterOptions;
  loading: boolean;
  totalCount?: number;
  filteredCount?: number;
  onClearAll?: () => void;
  onSearch?: (term: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PENDING: 'Pending',
  EXPIRED: 'Expired',
};

// ── Component ─────────────────────────────────────────────────────

export function PermitAdvancedFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  operatorFilter,
  setOperatorFilter,
  routeGroupFilter,
  setRouteGroupFilter,
  permitTypeFilter,
  setPermitTypeFilter,
  filterOptions,
  loading,
  totalCount = 0,
  filteredCount = 0,
  onClearAll,
}: PermitAdvancedFiltersProps) {

  const handleClearAll = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('__all__');
    setOperatorFilter('__all__');
    setRouteGroupFilter('__all__');
    setPermitTypeFilter('__all__');
    onClearAll?.();
  }, [setSearchTerm, setStatusFilter, setOperatorFilter, setRouteGroupFilter, setPermitTypeFilter, onClearAll]);

  // ── Options ─────────────────────────────────────────────────────

  const statusOptions = filterOptions.statuses.map((s) => ({
    value: s,
    label: STATUS_LABELS[s] ?? (s.charAt(0) + s.slice(1).toLowerCase()),
  }));

  const operatorOptions = filterOptions.operators.map((op) => ({
    value: op.id,
    label: op.name,
  }));

  const routeGroupOptions = filterOptions.routeGroups.map((rg) => ({
    value: rg.id,
    label: rg.name,
  }));

  const permitTypeOptions = filterOptions.permitTypes.map((t) => ({
    value: t,
    label: t,
  }));

  // ── Active filter count ─────────────────────────────────────────

  const activeFilterCount = [
    statusFilter !== '__all__',
    operatorFilter !== '__all__',
    routeGroupFilter !== '__all__',
    permitTypeFilter !== '__all__',
  ].filter(Boolean).length;

  // ── Render ──────────────────────────────────────────────────────

  return (
    <FilterBar
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="Search by permit number, operator, or route group…"
      activeFilterCount={activeFilterCount}
      onClearAll={handleClearAll}
    >
      <FilterSelect
        label="Statuses"
        value={statusFilter}
        onChange={setStatusFilter}
        options={statusOptions}
      />
      <FilterSelect
        label="Operators"
        value={operatorFilter}
        onChange={setOperatorFilter}
        options={operatorOptions}
      />
      <FilterSelect
        label="Route Groups"
        value={routeGroupFilter}
        onChange={setRouteGroupFilter}
        options={routeGroupOptions}
      />
      <FilterSelect
        label="Types"
        value={permitTypeFilter}
        onChange={setPermitTypeFilter}
        options={permitTypeOptions}
      />
    </FilterBar>
  );
}
