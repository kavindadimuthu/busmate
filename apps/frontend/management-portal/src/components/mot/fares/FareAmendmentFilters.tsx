'use client';

import React from 'react';
import { SearchFilterBar, SelectFilter, FilterChipDescriptor } from '@/components/shared/SearchFilterBar';
import { AmendmentStatus } from '@/data/mot/fares';

interface FareAmendmentFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  statusOptions: AmendmentStatus[];
  totalCount: number;
  filteredCount: number;
  onClearAll: () => void;
  loading?: boolean;
}

export function FareAmendmentFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  statusOptions,
  totalCount,
  filteredCount,
  onClearAll,
  loading,
}: FareAmendmentFiltersProps) {
  const activeChips: FilterChipDescriptor[] = [];

  if (statusFilter !== 'all') {
    activeChips.push({
      key: 'status',
      label: `Status: ${statusFilter}`,
      onRemove: () => onStatusChange('all'),
    });
  }

  return (
    <SearchFilterBar
      searchValue={searchTerm}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search by reference, title, or gazette number..."
      totalCount={totalCount}
      filteredCount={filteredCount}
      resultLabel="amendments"
      loading={loading}
      activeChips={activeChips}
      onClearAllFilters={onClearAll}
      filters={
        <SelectFilter
          value={statusFilter}
          onChange={onStatusChange}
          options={statusOptions.map((s) => ({ value: s, label: s }))}
          allLabel="All Statuses"
        />
      }
    />
  );
}
