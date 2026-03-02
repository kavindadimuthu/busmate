'use client';

import React, { useCallback, useMemo } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  MapPin,
  FileText,
} from 'lucide-react';
import {
  SearchFilterBar,
  SelectFilter,
} from '@/components/shared/SearchFilterBar';
import type { FilterChipDescriptor } from '@/components/shared/SearchFilterBar';

// ── Types ─────────────────────────────────────────────────────────

interface FilterOptions {
  statuses: Array<string>;
  operators: Array<{ id: string; name: string; operatorType?: string }>;
  routeGroups: Array<{ id: string; name: string; code?: string }>;
  permitTypes: Array<string>;
}

interface PermitAdvancedFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  operatorFilter: string;
  setOperatorFilter: (value: string) => void;
  routeGroupFilter: string;
  setRouteGroupFilter: (value: string) => void;
  permitTypeFilter: string;
  setPermitTypeFilter: (value: string) => void;
  filterOptions: FilterOptions;
  loading: boolean;
  totalCount?: number;
  filteredCount?: number;
  onClearAll?: () => void;
  onSearch?: (term: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PENDING: 'Pending',
  EXPIRED: 'Expired',
};

// ── Component ─────────────────────────────────────────────────────

export function PermitAdvancedFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  operatorFilter,
  setOperatorFilter,
  routeGroupFilter,
  setRouteGroupFilter,
  permitTypeFilter,
  setPermitTypeFilter,
  filterOptions,
  loading,
  totalCount = 0,
  filteredCount = 0,
  onClearAll,
}: PermitAdvancedFiltersProps) {

  const handleClearAll = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
    setOperatorFilter('all');
    setRouteGroupFilter('all');
    setPermitTypeFilter('all');
    onClearAll?.();
  }, [setSearchTerm, setStatusFilter, setOperatorFilter, setRouteGroupFilter, setPermitTypeFilter, onClearAll]);

  // ── Options ─────────────────────────────────────────────────────

  const statusOptions = filterOptions.statuses.map((s) => ({
    value: s,
    label: STATUS_LABELS[s] ?? (s.charAt(0) + s.slice(1).toLowerCase()),
  }));

  const operatorOptions = filterOptions.operators.map((op) => ({
    value: op.id,
    label: op.name,
  }));

  const routeGroupOptions = filterOptions.routeGroups.map((rg) => ({
    value: rg.id,
    label: rg.name,
  }));

  const permitTypeOptions = filterOptions.permitTypes.map((t) => ({
    value: t,
    label: t,
  }));

  // ── Active filter chips ─────────────────────────────────────────

  const activeChips = useMemo<FilterChipDescriptor[]>(() => {
    const chips: FilterChipDescriptor[] = [];

    if (statusFilter !== 'all') {
      const icons: Record<string, React.ReactNode> = {
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
        icon: icons[statusFilter],
      });
    }

    if (operatorFilter !== 'all') {
      const opName = filterOptions.operators.find((op) => op.id === operatorFilter)?.name ?? 'Unknown';
      chips.push({
        key: 'operator',
        label: opName,
        onRemove: () => setOperatorFilter('all'),
        colorClass: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: <Users className="h-3 w-3 opacity-70" />,
      });
    }

    if (routeGroupFilter !== 'all') {
      const rgName = filterOptions.routeGroups.find((rg) => rg.id === routeGroupFilter)?.name ?? 'Unknown';
      chips.push({
        key: 'routeGroup',
        label: rgName,
        onRemove: () => setRouteGroupFilter('all'),
        colorClass: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: <MapPin className="h-3 w-3 opacity-70" />,
      });
    }

    if (permitTypeFilter !== 'all') {
      chips.push({
        key: 'permitType',
        label: permitTypeFilter,
        onRemove: () => setPermitTypeFilter('all'),
        colorClass: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: <FileText className="h-3 w-3 opacity-70" />,
      });
    }

    return chips;
  }, [statusFilter, operatorFilter, routeGroupFilter, permitTypeFilter, filterOptions, setStatusFilter, setOperatorFilter, setRouteGroupFilter, setPermitTypeFilter]);

  // ── Render ──────────────────────────────────────────────────────

  return (
    <SearchFilterBar
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="Search by permit number, operator, or route group…"
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
            value={operatorFilter}
            onChange={setOperatorFilter}
            options={operatorOptions}
            allLabel="All Operators"
            icon={<Users className="h-3.5 w-3.5" />}
            activeColorClass="bg-blue-50 border-blue-300 text-blue-800"
          />
          <SelectFilter
            value={routeGroupFilter}
            onChange={setRouteGroupFilter}
            options={routeGroupOptions}
            allLabel="All Route Groups"
            icon={<MapPin className="h-3.5 w-3.5" />}
            activeColorClass="bg-purple-50 border-purple-300 text-purple-800"
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
