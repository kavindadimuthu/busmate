'use client';

import * as React from 'react';
import { FilterBar, FilterSelect } from '@busmate/ui';

export interface NotificationFilters {
  type: string;
  priority: string;
}

const TYPE_OPTIONS = [
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'critical', label: 'Critical' },
  { value: 'success', label: 'Success' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'error', label: 'Error' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

interface NotificationsFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: NotificationFilters;
  onFiltersChange: (filters: Partial<NotificationFilters>) => void;
  onClearAll: () => void;
  activeFilterCount?: number;
}

export function NotificationsFilterBar({
  searchValue,
  onSearchChange,
  filters,
  onFiltersChange,
  onClearAll,
  activeFilterCount = 0,
}: NotificationsFilterBarProps) {
  return (
    <FilterBar
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search notifications by title, content, or sender…"
      activeFilterCount={activeFilterCount}
      onClearAll={onClearAll}
    >
      <FilterSelect
        label="Type"
        value={filters.type ?? '__all__'}
        onChange={(value) => onFiltersChange({ type: value })}
        options={TYPE_OPTIONS}
        placeholder="All Types"
      />
      <FilterSelect
        label="Priority"
        value={filters.priority ?? '__all__'}
        onChange={(value) => onFiltersChange({ priority: value })}
        options={PRIORITY_OPTIONS}
        placeholder="All Priorities"
      />
    </FilterBar>
  );
}
