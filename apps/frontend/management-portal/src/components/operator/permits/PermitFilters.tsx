'use client';

import React, { useCallback, useMemo } from 'react';
import { CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import {
  SearchFilterBar,
  SelectFilter,
} from '@/components/shared/SearchFilterBar';
import type { FilterChipDescriptor } from '@/components/shared/SearchFilterBar';
import type { OperatorPermitFilterOptions } from '@/data/operator/permits';

// ── Types ─────────────────────────────────────────────────────────

interface PermitFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  permitTypeFilter: string;
  setPermitTypeFilter: (value: string) => void;
  filterOptions: OperatorPermitFilterOptions;
  loading: boolean;
  totalCount?: number;
  filteredCount?: number;
  onClearAll?: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PENDING: 'Pending',
  EXPIRED: 'Expired',
};

const PERMIT_TYPE_LABELS: Record<string, string> = {
  REGULAR: 'Regular',
  SPECIAL: 'Special',
  TEMPORARY: 'Temporary',
};

// ── Component ─────────────────────────────────────────────────────

export function PermitFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  permitTypeFilter,
  setPermitTypeFilter,
  filterOptions,
  loading,
  totalCount = 0,
  filteredCount = 0,
  onClearAll,
}: PermitFiltersProps) {
  const handleClearAll = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
    setPermitTypeFilter('all');
    onClearAll?.();
  }, [setSearchTerm, setStatusFilter, setPermitTypeFilter, onClearAll]);

  // ── Options ─────────────────────────────────────────────────────

  const statusOptions = filterOptions.statuses.map((s) => ({
    value: s,
    label: STATUS_LABELS[s] ?? (s.charAt(0) + s.slice(1).toLowerCase()),
  }));

  const permitTypeOptions = filterOptions.permitTypes.map((t) => ({
    value: t,
    label: PERMIT_TYPE_LABELS[t] ?? t,
  }));

  // ── Active filter chips ─────────────────────────────────────────

  const activeChips = useMemo<FilterChipDescriptor[]>(() => {
    const chips: FilterChipDescriptor[] = [];

    if (statusFilter !== 'all') {
      const statusIcons: Record<string, React.ReactNode> = {
        ACTIVE: <CheckCircle className="h-3 w-3 opacity-70" />,
        INACTIVE: <XCircle className="h-3 w-3 opacity-70" />,
        PENDING: <Clock className="h-3 w-3 opacity-70" />,
        EXPIRED: <XCircle className="h-3 w-3 opacity-70" />,
      };
      chips.push({
        key: 'status',
        label: STATUS_LABELS[statusFilter] ?? statusFilter,
        onRemove: () => setStatusFilter('all'),
        colorClass: 'bg-green-50 text-green-700 border-green-200',
        icon: statusIcons[statusFilter],
      });
    }

    if (permitTypeFilter !== 'all') {
      chips.push({
        key: 'permitType',
        label: PERMIT_TYPE_LABELS[permitTypeFilter] ?? permitTypeFilter,
        onRemove: () => setPermitTypeFilter('all'),
        colorClass: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: <FileText className="h-3 w-3 opacity-70" />,
      });
    }

    return chips;
  }, [statusFilter, permitTypeFilter, setStatusFilter, setPermitTypeFilter]);

  // ── Render ──────────────────────────────────────────────────────

  return (
    <SearchFilterBar
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="Search by permit number or route group…"
      totalCount={totalCount}
      filteredCount={filteredCount}
      resultLabel="permit"
      loading={loading}
      filters={
        <>
          <SelectFilter
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            allLabel="All Statuses"
            icon={<CheckCircle className="h-3.5 w-3.5" />}
            activeColorClass="bg-green-50 border-green-300 text-green-800"
          />
          <SelectFilter
            value={permitTypeFilter}
            onChange={setPermitTypeFilter}
            options={permitTypeOptions}
            allLabel="All Types"
            icon={<FileText className="h-3.5 w-3.5" />}
            activeColorClass="bg-amber-50 border-amber-300 text-amber-800"
          />
        </>
      }
      activeChips={activeChips}
      onClearAllFilters={handleClearAll}
    />
  );
}
