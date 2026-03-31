'use client';

import { FilterBar, FilterSelect } from '@busmate/ui';
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
  onClearAll,
}: FareAmendmentFiltersProps) {
  const activeFilterCount = statusFilter !== '__all__' ? 1 : 0;

  return (
    <FilterBar
      searchValue={searchTerm}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search by reference, title, or gazette number..."
      activeFilterCount={activeFilterCount}
      onClearAll={onClearAll}
    >
      <FilterSelect
        label="Statuses"
        value={statusFilter}
        onChange={onStatusChange}
        options={statusOptions.map((s) => ({ value: s, label: s }))}
      />
    </FilterBar>
  );
}
