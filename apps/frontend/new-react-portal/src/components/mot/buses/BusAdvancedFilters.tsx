'use client';

import { useMemo } from 'react';
import { FilterBar, FilterSelect } from '@busmate/ui';

interface FilterOptions {
  statuses: Array<string>;
  operators: Array<{ id: string; name: string; type?: string }>;
  models: Array<string>;
  capacityRanges: Array<string>;
}

interface BusAdvancedFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  operatorFilter: string;
  setOperatorFilter: (value: string) => void;
  minCapacity: string;
  setMinCapacity: (value: string) => void;
  maxCapacity: string;
  setMaxCapacity: (value: string) => void;
  modelFilter: string;
  setModelFilter: (value: string) => void;
  filterOptions: FilterOptions;
  loading: boolean;
  totalCount?: number;
  filteredCount?: number;
  onClearAll?: () => void;
  onSearch?: (term: string) => void;
}

export default function BusAdvancedFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  operatorFilter,
  setOperatorFilter,
  minCapacity,
  setMinCapacity,
  maxCapacity,
  setMaxCapacity,
  modelFilter,
  setModelFilter,
  filterOptions,
  loading,
  totalCount = 0,
  filteredCount = 0,
  onClearAll,
  onSearch,
}: BusAdvancedFiltersProps) {
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onSearch?.(value);
  };

  const statusOptions = useMemo(
    () => filterOptions.statuses.map((s) => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase() })),
    [filterOptions.statuses]
  );

  const operatorOptions = useMemo(
    () => filterOptions.operators.map((op) => ({ value: op.id, label: op.name })),
    [filterOptions.operators]
  );

  const modelOptions = useMemo(
    () => filterOptions.models.map((m) => ({ value: m, label: m })),
    [filterOptions.models]
  );

  const activeFilterCount = [statusFilter, operatorFilter, modelFilter].filter(v => v !== '__all__').length + (minCapacity || maxCapacity ? 1 : 0);

  const handleClearAll = () => {
    setSearchTerm('');
    setStatusFilter('__all__');
    setOperatorFilter('__all__');
    setModelFilter('__all__');
    setMinCapacity('');
    setMaxCapacity('');
    onClearAll?.();
  };

  return (
    <FilterBar
      searchValue={searchTerm}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Search by registration, plate number, model, or operator..."
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
        label="Models"
        value={modelFilter}
        onChange={setModelFilter}
        options={modelOptions}
      />
      {/* Capacity range inputs */}
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          placeholder="Min"
          value={minCapacity}
          onChange={(e) => setMinCapacity(e.target.value)}
          className="w-16 rounded-lg border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-primary"
          min="0"
        />
        <span className="text-muted-foreground/70 text-xs">–</span>
        <input
          type="number"
          placeholder="Max"
          value={maxCapacity}
          onChange={(e) => setMaxCapacity(e.target.value)}
          className="w-16 rounded-lg border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-primary"
          min="0"
        />
      </div>
    </FilterBar>
  );
}
