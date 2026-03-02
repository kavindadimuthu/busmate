'use client';

import { useMemo } from 'react';
import {
  SearchFilterBar,
  SelectFilter,
  FilterChipDescriptor,
} from '@/components/shared/SearchFilterBar';

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

const STATUS_LABELS: Record<string, string> = {
  ACTIVE:    'Active',
  INACTIVE:  'Inactive',
  ON_LEAVE:  'On Leave',
  SUSPENDED: 'Suspended',
};

const SHIFT_LABELS: Record<string, string> = {
  AVAILABLE: 'Available',
  ASSIGNED:  'Assigned',
  OFF_DUTY:  'Off Duty',
};

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
  const activeChips = useMemo<FilterChipDescriptor[]>(() => {
    const chips: FilterChipDescriptor[] = [];

    if (statusFilter !== 'all') {
      chips.push({
        key: 'status',
        label: `Status: ${STATUS_LABELS[statusFilter] ?? statusFilter}`,
        onRemove: () => setStatusFilter('all'),
      });
    }

    if (shiftFilter !== 'all') {
      chips.push({
        key: 'shift',
        label: `Shift: ${SHIFT_LABELS[shiftFilter] ?? shiftFilter}`,
        onRemove: () => setShiftFilter('all'),
      });
    }

    return chips;
  }, [statusFilter, shiftFilter, setStatusFilter, setShiftFilter]);

  return (
    <SearchFilterBar
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="Search by name, NIC, phone or employee ID…"
      totalCount={totalCount}
      filteredCount={filteredCount}
      resultLabel="staff members"
      loading={loading}
      activeChips={activeChips}
      onClearAllFilters={onClearAll}
      filters={
        <>
          <SelectFilter
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS}
            allLabel="All Statuses"
          />
          <SelectFilter
            value={shiftFilter}
            onChange={setShiftFilter}
            options={SHIFT_OPTIONS}
            allLabel="All Shifts"
          />
        </>
      }
    />
  );
}
