'use client';

import { useCallback, useMemo } from 'react';
import { FilterBar, FilterSelect } from '@busmate/ui';
import { USER_STATUS_CONFIG, type UserStatus } from '@/data/admin/users';

// ── Types ─────────────────────────────────────────────────────────

interface UserAdvancedFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: UserStatus | '__all__';
  setStatusFilter: (value: UserStatus | '__all__') => void;
  onClearAll?: () => void;
  onSearch?: (term: string) => void;
}

// ── Component ─────────────────────────────────────────────────────

export function UserAdvancedFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  onClearAll,
  onSearch,
}: UserAdvancedFiltersProps) {

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
    onClearAll?.();
  }, [setSearchTerm, setStatusFilter, onClearAll]);

  // ── Filter options ──────────────────────────────────────────────

  const statusOptions = useMemo(() => {
    return (Object.keys(USER_STATUS_CONFIG) as UserStatus[]).map((status) => ({
      value: status,
      label: USER_STATUS_CONFIG[status].label,
    }));
  }, []);

  // ── Active filter count ─────────────────────────────────────────

  const activeFilterCount = [statusFilter].filter(v => v !== '__all__').length;

  // ── Render ──────────────────────────────────────────────────────

  return (
    <FilterBar
      searchValue={searchTerm}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Search users by name, email, phone, NIC, or ID…"
      activeFilterCount={activeFilterCount}
      onClearAll={handleClearAll}
    >
      <FilterSelect
        label="Statuses"
        value={statusFilter}
        onChange={(val: string) => setStatusFilter(val as UserStatus | '__all__')}
        options={statusOptions}
      />
    </FilterBar>
  );
}
