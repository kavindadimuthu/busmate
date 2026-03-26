'use client';

import React, { useCallback, useMemo } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Building,
  MapPin,
} from 'lucide-react';
import {
  SearchFilterBar,
  SelectFilter,
} from '@/components/shared/SearchFilterBar';
import type { FilterChipDescriptor } from '@/components/shared/SearchFilterBar';

// ── Types ─────────────────────────────────────────────────────────

interface FilterOptions {
  statuses: Array<'pending' | 'active' | 'inactive' | 'cancelled'>;
  operatorTypes: Array<'PRIVATE' | 'CTB'>;
  regions: Array<string>;
}

interface OperatorAdvancedFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  operatorTypeFilter: string;
  setOperatorTypeFilter: (value: string) => void;
  regionFilter: string;
  setRegionFilter: (value: string) => void;
  filterOptions: FilterOptions;
  loading: boolean;
  totalCount?: number;
  filteredCount?: number;
  onClearAll?: () => void;
  onSearch?: (term: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  active: 'Active',
  inactive: 'Inactive',
  cancelled: 'Cancelled',
};

const TYPE_LABELS: Record<string, string> = {
  PRIVATE: 'Private',
  CTB: 'CTB',
};

// ── Component ─────────────────────────────────────────────────────

export default function OperatorAdvancedFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  operatorTypeFilter,
  setOperatorTypeFilter,
  regionFilter,
  setRegionFilter,
  filterOptions,
  loading,
  totalCount = 0,
  filteredCount = 0,
  onClearAll,
  onSearch,
}: OperatorAdvancedFiltersProps) {

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
    setStatusFilter('all');
    setOperatorTypeFilter('all');
    setRegionFilter('all');
    onClearAll?.();
  }, [setSearchTerm, setStatusFilter, setOperatorTypeFilter, setRegionFilter, onClearAll]);

  // ── Options ─────────────────────────────────────────────────────

  const statusOptions = filterOptions.statuses.map((s) => ({
    value: s,
    label: STATUS_LABELS[s] ?? s,
  }));

  const typeOptions = filterOptions.operatorTypes.map((t) => ({
    value: t,
    label: TYPE_LABELS[t] ?? t,
  }));

  const regionOptions = filterOptions.regions.map((r) => ({
    value: r,
    label: r,
  }));

  // ── Active filter chips ─────────────────────────────────────────

  const activeChips = useMemo<FilterChipDescriptor[]>(() => {
    const chips: FilterChipDescriptor[] = [];

    if (statusFilter !== 'all') {
      const icons: Record<string, React.ReactNode> = {
        active: <CheckCircle className="h-3 w-3 opacity-70" />,
        inactive: <XCircle className="h-3 w-3 opacity-70" />,
        pending: <Clock className="h-3 w-3 opacity-70" />,
        cancelled: <XCircle className="h-3 w-3 opacity-70" />,
      };
      chips.push({
        key: 'status',
        label: STATUS_LABELS[statusFilter] ?? statusFilter,
        onRemove: () => setStatusFilter('all'),
        colorClass: 'bg-success/10 text-success border-success/20',
        icon: icons[statusFilter],
      });
    }

    if (operatorTypeFilter !== 'all') {
      chips.push({
        key: 'operatorType',
        label: TYPE_LABELS[operatorTypeFilter] ?? operatorTypeFilter,
        onRemove: () => setOperatorTypeFilter('all'),
        colorClass: 'bg-primary/10 text-primary border-primary/20',
        icon: <Building className="h-3 w-3 opacity-70" />,
      });
    }

    if (regionFilter !== 'all') {
      chips.push({
        key: 'region',
        label: regionFilter,
        onRemove: () => setRegionFilter('all'),
        colorClass: 'bg-[hsl(var(--purple-50))] text-[hsl(var(--purple-700))] border-[hsl(var(--purple-200))]',
        icon: <MapPin className="h-3 w-3 opacity-70" />,
      });
    }

    return chips;
  }, [statusFilter, operatorTypeFilter, regionFilter, setStatusFilter, setOperatorTypeFilter, setRegionFilter]);

  // ── Render ──────────────────────────────────────────────────────

  return (
    <SearchFilterBar
      searchValue={searchTerm}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Search operators by name or region…"
      totalCount={totalCount}
      filteredCount={filteredCount}
      resultLabel="operator"
      loading={loading}
      filters={
        <>
          <SelectFilter
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            allLabel="All Statuses"
            icon={<CheckCircle className="h-3.5 w-3.5" />}
            activeColorClass="bg-success/10 border-success/30 text-success"
          />
          <SelectFilter
            value={operatorTypeFilter}
            onChange={setOperatorTypeFilter}
            options={typeOptions}
            allLabel="All Types"
            icon={<Building className="h-3.5 w-3.5" />}
            activeColorClass="bg-primary/10 border-primary/30 text-primary"
          />
          <SelectFilter
            value={regionFilter}
            onChange={setRegionFilter}
            options={regionOptions}
            allLabel="All Regions"
            icon={<MapPin className="h-3.5 w-3.5" />}
            activeColorClass="bg-[hsl(var(--purple-50))] border-purple-300 text-[hsl(var(--purple-800))]"
          />
        </>
      }
      activeChips={activeChips}
      onClearAllFilters={handleClearAll}
    />
  );
}
