'use client';

import { FilterBar, FilterSelect } from '@busmate/ui';

// ── Types ─────────────────────────────────────────────────────────

interface StaffAdvancedFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  shiftFilter: string;
  setShiftFilter: (value: string) => void;
  loading?: boolean;
  totalCount?: number;
  filteredCount?: number;
  onClearAll?: () => void;
}

// ── Constants ─────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'ACTIVE',    label: 'Active' },
  { value: 'INACTIVE',  label: 'Inactive' },
  { value: 'ON_LEAVE',  label: 'On Leave' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

const SHIFT_OPTIONS = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'ASSIGNED',  label: 'Assigned' },
  { value: 'OFF_DUTY',  label: 'Off Duty' },
];

// ── Component ─────────────────────────────────────────────────────

export function StaffAdvancedFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  shiftFilter,
  setShiftFilter,
  loading = false,
  totalCount = 0,
  filteredCount = 0,
  onClearAll,
}: StaffAdvancedFiltersProps) {
  const activeFilterCount = [statusFilter, shiftFilter].filter(v => v !== '__all__').length;

  return (
    <FilterBar
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="Search by name, NIC, phone or employee ID…"
      activeFilterCount={activeFilterCount}
      onClearAll={onClearAll}
    >
      <FilterSelect
        label="Statuses"
        value={statusFilter}
        onChange={setStatusFilter}
        options={STATUS_OPTIONS}
      />
      <FilterSelect
        label="Shifts"
        value={shiftFilter}
        onChange={setShiftFilter}
        options={SHIFT_OPTIONS}
      />
    </FilterBar>
  );
}
