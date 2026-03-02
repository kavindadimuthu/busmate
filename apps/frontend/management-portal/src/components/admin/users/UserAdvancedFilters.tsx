'use client';

import React, { useCallback, useMemo } from 'react'; 
import {
  Shield,
  Clock,
  Truck,
  CircleDot,
  Car,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserPlus,
} from 'lucide-react';
import {
  SearchFilterBar,
  SelectFilter,
  type FilterChipDescriptor,
} from '@/components/shared/SearchFilterBar';
import { USER_TYPE_CONFIG, USER_STATUS_CONFIG, type UserType, type UserStatus } from '@/data/admin/users';

// ── Types ─────────────────────────────────────────────────────────

interface UserAdvancedFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  userTypeFilter: UserType | 'all';
  setUserTypeFilter: (value: UserType | 'all') => void;
  statusFilter: UserStatus | 'all';
  setStatusFilter: (value: UserStatus | 'all') => void;
  loading?: boolean;
  totalCount?: number;
  filteredCount?: number;
  onClearAll?: () => void;
  onSearch?: (term: string) => void;
}

// ── Icon mapping ──────────────────────────────────────────────────

const USER_TYPE_ICONS: Record<UserType, React.ComponentType<{ className?: string }>> = {
  mot: Shield,
  timekeeper: Clock,
  operator: Truck,
  conductor: CircleDot,
  driver: Car,
  passenger: Users,
};

const STATUS_ICONS: Record<UserStatus, React.ComponentType<{ className?: string }>> = {
  active: CheckCircle,
  inactive: XCircle,
  suspended: AlertTriangle,
  pending: UserPlus,
};

// ── Component ─────────────────────────────────────────────────────

export function UserAdvancedFilters({
  searchTerm,
  setSearchTerm,
  userTypeFilter,
  setUserTypeFilter,
  statusFilter,
  setStatusFilter,
  loading = false,
  totalCount = 0,
  filteredCount = 0,
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
    setUserTypeFilter('all');
    setStatusFilter('all');
    onClearAll?.();
  }, [setSearchTerm, setUserTypeFilter, setStatusFilter, onClearAll]);

  // ── Filter options ──────────────────────────────────────────────

  const userTypeOptions = useMemo(() => {
    return (Object.keys(USER_TYPE_CONFIG) as UserType[]).map((type) => ({
      value: type,
      label: USER_TYPE_CONFIG[type].label,
    }));
  }, []);

  const statusOptions = useMemo(() => {
    return (Object.keys(USER_STATUS_CONFIG) as UserStatus[]).map((status) => ({
      value: status,
      label: USER_STATUS_CONFIG[status].label,
    }));
  }, []);

  // ── Active filter chips ─────────────────────────────────────────

  const activeChips = useMemo<FilterChipDescriptor[]>(() => {
    const chips: FilterChipDescriptor[] = [];

    if (userTypeFilter !== 'all') {
      const config = USER_TYPE_CONFIG[userTypeFilter];
      const Icon = USER_TYPE_ICONS[userTypeFilter];
      chips.push({
        key: 'userType',
        label: config.label,
        onRemove: () => setUserTypeFilter('all'),
        colorClass: `${config.bgColor} ${config.color} ${config.borderColor}`,
        icon: <Icon className="h-3 w-3 opacity-70" />,
      });
    }

    if (statusFilter !== 'all') {
      const config = USER_STATUS_CONFIG[statusFilter];
      const Icon = STATUS_ICONS[statusFilter];
      chips.push({
        key: 'status',
        label: config.label,
        onRemove: () => setStatusFilter('all'),
        colorClass: `${config.bgColor} ${config.color} ${config.borderColor}`,
        icon: <Icon className="h-3 w-3 opacity-70" />,
      });
    }

    return chips;
  }, [userTypeFilter, statusFilter, setUserTypeFilter, setStatusFilter]);

  // ── Render ──────────────────────────────────────────────────────

  return (
    <SearchFilterBar
      searchValue={searchTerm}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Search users by name, email, phone, NIC, or ID…"
      totalCount={totalCount}
      filteredCount={filteredCount}
      resultLabel="user"
      loading={loading}
      filters={
        <>
          <SelectFilter
            value={userTypeFilter}
            onChange={(val: string) => setUserTypeFilter(val as UserType | 'all')}
            options={userTypeOptions}
            allLabel="All Types"
            icon={<Users className="h-3.5 w-3.5" />}
            activeColorClass="bg-blue-50 border-blue-300 text-blue-800"
          />
          <SelectFilter
            value={statusFilter}
            onChange={(val: string) => setStatusFilter(val as UserStatus | 'all')}
            options={statusOptions}
            allLabel="All Statuses"
            icon={<CheckCircle className="h-3.5 w-3.5" />}
            activeColorClass="bg-green-50 border-green-300 text-green-800"
          />
        </>
      }
      activeChips={activeChips}
      onClearAllFilters={handleClearAll}
    />
  );
}
