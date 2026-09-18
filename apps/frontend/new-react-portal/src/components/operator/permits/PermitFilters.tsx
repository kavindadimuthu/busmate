'use client';

import { FilterBar, FilterSelect } from '@busmate/ui';
import { PERMIT_TYPES } from '@/lib/permits';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Suspended' },
  { value: 'cancelled', label: 'Withdrawn' },
];
const TYPE_OPTIONS = PERMIT_TYPES.map((t) => ({ value: t.value, label: t.label }));

interface PermitFiltersProps {
  search: string;
  onSearch: (value: string) => void;
  status: string;
  onStatus: (value: string) => void;
  permitType: string;
  onPermitType: (value: string) => void;
  onClearAll: () => void;
}

export function PermitFilters({ search, onSearch, status, onStatus, permitType, onPermitType, onClearAll }: PermitFiltersProps) {
  const activeFilterCount = [status, permitType].filter((v) => v && v !== '__all__').length;
  return (
    <FilterBar
      searchValue={search}
      onSearchChange={onSearch}
      searchPlaceholder="Search by permit number or route group…"
      activeFilterCount={activeFilterCount}
      onClearAll={onClearAll}
    >
      <FilterSelect label="Statuses" value={status || '__all__'} onChange={onStatus} options={STATUS_OPTIONS} />
      <FilterSelect label="Types" value={permitType || '__all__'} onChange={onPermitType} options={TYPE_OPTIONS} />
    </FilterBar>
  );
}
