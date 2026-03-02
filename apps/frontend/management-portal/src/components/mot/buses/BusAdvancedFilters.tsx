'use client';

import React, { useMemo } from 'react';
import { Bus, Users } from 'lucide-react';
import { SearchFilterBar, SelectFilter, FilterChipDescriptor } from '@/components/shared/SearchFilterBar';

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

  const activeChips = useMemo(() => {
    const chips: FilterChipDescriptor[] = [];
    if (statusFilter !== 'all') {
      chips.push({
        key: 'status',
        label: `Status: ${statusFilter.charAt(0) + statusFilter.slice(1).toLowerCase()}`,
        onRemove: () => setStatusFilter('all'),
        colorClass: 'bg-green-100 text-green-800',
      });
    }
    if (operatorFilter !== 'all') {
      const opName = filterOptions.operators.find((op) => op.id === operatorFilter)?.name || 'Unknown';
      chips.push({
        key: 'operator',
        label: `Operator: ${opName}`,
        onRemove: () => setOperatorFilter('all'),
        colorClass: 'bg-blue-100 text-blue-800',
        icon: <Users className="h-4 w-4" />,
      });
    }
    if (modelFilter !== 'all') {
      chips.push({
        key: 'model',
        label: `Model: ${modelFilter}`,
        onRemove: () => setModelFilter('all'),
        colorClass: 'bg-purple-100 text-purple-800',
        icon: <Bus className="h-4 w-4" />,
      });
    }
    if (minCapacity || maxCapacity) {
      chips.push({
        key: 'capacity',
        label: `Capacity: ${minCapacity || '0'} – ${maxCapacity || '∞'}`,
        onRemove: () => {
          setMinCapacity('');
          setMaxCapacity('');
        },
        colorClass: 'bg-amber-100 text-amber-800',
      });
    }
    return chips;
  }, [statusFilter, operatorFilter, modelFilter, minCapacity, maxCapacity, filterOptions.operators, setStatusFilter, setOperatorFilter, setModelFilter, setMinCapacity, setMaxCapacity]);

  const handleClearAll = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setOperatorFilter('all');
    setModelFilter('all');
    setMinCapacity('');
    setMaxCapacity('');
    onClearAll?.();
  };

  return (
    <SearchFilterBar
      searchValue={searchTerm}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Search by registration, plate number, model, or operator..."
      totalCount={totalCount}
      filteredCount={filteredCount}
      resultLabel="buses"
      loading={loading}
      activeChips={activeChips}
      onClearAllFilters={handleClearAll}
      filters={
        <>
          <SelectFilter
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            allLabel="All Statuses"
            activeColorClass="ring-green-500 border-green-500"
          />
          <SelectFilter
            value={operatorFilter}
            onChange={setOperatorFilter}
            options={operatorOptions}
            allLabel="All Operators"
            icon={<Users className="h-3.5 w-3.5" />}
            activeColorClass="ring-blue-500 border-blue-500"
          />
          <SelectFilter
            value={modelFilter}
            onChange={setModelFilter}
            options={modelOptions}
            allLabel="All Models"
            icon={<Bus className="h-3.5 w-3.5" />}
            activeColorClass="ring-purple-500 border-purple-500"
          />
          {/* Capacity range inputs */}
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              placeholder="Min"
              value={minCapacity}
              onChange={(e) => setMinCapacity(e.target.value)}
              className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
            />
            <span className="text-gray-400 text-xs">–</span>
            <input
              type="number"
              placeholder="Max"
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(e.target.value)}
              className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
            />
          </div>
        </>
      }
    />
  );
}
