'use client';

import { useCallback } from 'react';
import { FilterBar, FilterSelect } from '@busmate/ui';
import type { OperatorPermitFilterOptions } from '@/data/operator/permits';

// ── Types ─────────────────────────────────────────────────────────

interface PermitFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  permitTypeFilter: string;
  setPermitTypeFilter: (value: string) => void;
  filterOptions: OperatorPermitFilterOptions;
  loading: boolean;
  totalCount?: number;
  filteredCount?: number;
  onClearAll?: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PENDING: 'Pending',
  EXPIRED: 'Expired',
};

const PERMIT_TYPE_LABELS: Record<string, string> = {
  REGULAR: 'Regular',
  SPECIAL: 'Special',
  TEMPORARY: 'Temporary',
};

// ── Component ─────────────────────────────────────────────────────

export function PermitFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  permitTypeFilter,
  setPermitTypeFilter,
  filterOptions,
  loading,
  totalCount = 0,
  filteredCount = 0,
  onClearAll,
}: PermitFiltersProps) {
  const handleClearAll = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('__all__');
    setPermitTypeFilter('__all__');
    onClearAll?.();
  }, [setSearchTerm, setStatusFilter, setPermitTypeFilter, onClearAll]);

  // ── Options ─────────────────────────────────────────────────────

  const statusOptions = filterOptions.statuses.map((s) => ({
    value: s,
    label: STATUS_LABELS[s] ?? (s.charAt(0) + s.slice(1).toLowerCase()),
  }));

  const permitTypeOptions = filterOptions.permitTypes.map((t) => ({
    value: t,
    label: PERMIT_TYPE_LABELS[t] ?? t,
  }));

  // ── Active filter count ─────────────────────────────────────────

  const activeFilterCount = [statusFilter, permitTypeFilter].filter(v => v !== '__all__').length;

  // ── Render ──────────────────────────────────────────────────────

  return (
    <FilterBar
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="Search by permit number or route group…"
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
        label="Types"
        value={permitTypeFilter}
        onChange={setPermitTypeFilter}
        options={permitTypeOptions}
      />
    </FilterBar>
  );
}
