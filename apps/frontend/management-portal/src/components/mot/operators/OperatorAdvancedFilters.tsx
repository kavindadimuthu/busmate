'use client';

import { useCallback } from 'react';
import { FilterBar, FilterSelect } from '@busmate/ui';

// ── Types ─────────────────────────────────────────────────────────

interface FilterOptions {
  statuses: Array<'pending' | 'active' | 'inactive' | 'cancelled'>;
  operatorTypes: Array<'PRIVATE' | 'CTB'>;
  regions: Array<string>;
}

interface OperatorAdvancedFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  operatorTypeFilter: string;
  setOperatorTypeFilter: (value: string) => void;
  regionFilter: string;
  setRegionFilter: (value: string) => void;
  filterOptions: FilterOptions;
  loading: boolean;
  totalCount?: number;
  filteredCount?: number;
  onClearAll?: () => void;
  onSearch?: (term: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  active: 'Active',
  inactive: 'Inactive',
  cancelled: 'Cancelled',
};

const TYPE_LABELS: Record<string, string> = {
  PRIVATE: 'Private',
  CTB: 'CTB',
};

// ── Component ─────────────────────────────────────────────────────

export default function OperatorAdvancedFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  operatorTypeFilter,
  setOperatorTypeFilter,
  regionFilter,
  setRegionFilter,
  filterOptions,
  loading,
  totalCount = 0,
  filteredCount = 0,
  onClearAll,
  onSearch,
}: OperatorAdvancedFiltersProps) {

  // ── Search handler ──────────────────────────────────────────────

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
      onSearch?.(value);
    },
    [setSearchTerm, onSearch],
  );

  // ── Clear all ───────────────────────────────────────────────────

  const handleClearAll = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('__all__');
    setOperatorTypeFilter('__all__');
    setRegionFilter('__all__');
    onClearAll?.();
  }, [setSearchTerm, setStatusFilter, setOperatorTypeFilter, setRegionFilter, onClearAll]);

  // ── Options ─────────────────────────────────────────────────────

  const statusOptions = filterOptions.statuses.map((s) => ({
    value: s,
    label: STATUS_LABELS[s] ?? s,
  }));

  const typeOptions = filterOptions.operatorTypes.map((t) => ({
    value: t,
    label: TYPE_LABELS[t] ?? t,
  }));

  const regionOptions = filterOptions.regions.map((r) => ({
    value: r,
    label: r,
  }));

  // ── Active filter count ─────────────────────────────────────────

  const activeFilterCount = [statusFilter, operatorTypeFilter, regionFilter].filter(v => v !== '__all__').length;

  // ── Render ──────────────────────────────────────────────────────

  return (
    <FilterBar
      searchValue={searchTerm}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Search operators by name or region…"
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
        value={operatorTypeFilter}
        onChange={setOperatorTypeFilter}
        options={typeOptions}
      />
      <FilterSelect
        label="Regions"
        value={regionFilter}
        onChange={setRegionFilter}
        options={regionOptions}
      />
    </FilterBar>
  );
}
