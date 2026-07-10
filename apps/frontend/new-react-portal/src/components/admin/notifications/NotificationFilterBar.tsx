'use client';

import { FilterBar, FilterSelect } from '@busmate/ui';

interface FilterConfigItem {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface NotificationFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClearAll: () => void;
  filterConfig: FilterConfigItem[];
  activeFilterCount?: number;
}

export function NotificationFilterBar({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  onClearAll,
  filterConfig,
  activeFilterCount = 0,
}: NotificationFilterBarProps) {
  return (
    <FilterBar
      searchValue={searchTerm}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search notifications by title, body, sender..."
      activeFilterCount={activeFilterCount}
      onClearAll={onClearAll}
    >
      {filterConfig.map((config) => (
        <FilterSelect
          key={config.key}
          label={config.label}
          value={filters[config.key] ?? '__all__'}
          onChange={(value) => onFilterChange(config.key, value)}
          options={config.options}
          className="w-40"
        />
      ))}
    </FilterBar>
  );
}
