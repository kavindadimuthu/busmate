'use client';

import React, { useCallback, useMemo } from 'react';
import { Activity, Bus } from 'lucide-react';
import {
  SearchFilterBar,
  SelectFilter,
  type FilterChipDescriptor,
} from '@/components/shared/SearchFilterBar';
import type { BusStatus, BusServiceType } from '@/data/operator/buses';

// ── Types ─────────────────────────────────────────────────────────

interface FleetFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: BusStatus | 'ALL';
  onStatusChange: (v: BusStatus | 'ALL') => void;
  serviceTypeFilter: BusServiceType | 'ALL';
  onServiceTypeChange: (v: BusServiceType | 'ALL') => void;
  onClearAll: () => void;
  totalCount: number;
  filteredCount: number;
  loading?: boolean;
}

// ── Filter options ────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'ACTIVE',      label: 'Active'       },
  { value: 'INACTIVE',    label: 'Inactive'     },
  { value: 'MAINTENANCE', label: 'Maintenance'  },
  { value: 'RETIRED',     label: 'Retired'      },
];

const SERVICE_TYPE_OPTIONS = [
  { value: 'SL',          label: 'SL (Normal)'  },
  { value: 'SL_AC',       label: 'SL A/C'       },
  { value: 'SEMI_LUXURY', label: 'Semi-Luxury'  },
  { value: 'LUXURY',      label: 'Luxury'        },
  { value: 'EXPRESS',     label: 'Express'       },
];

// ── Component ─────────────────────────────────────────────────────

export function FleetFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  serviceTypeFilter,
  onServiceTypeChange,
  onClearAll,
  totalCount,
  filteredCount,
  loading = false,
}: FleetFiltersProps) {
  const activeChips = useMemo<FilterChipDescriptor[]>(() => {
    const chips: FilterChipDescriptor[] = [];

    if (statusFilter !== 'ALL') {
      chips.push({
        key:        'status',
        label:      `Status: ${STATUS_OPTIONS.find(o => o.value === statusFilter)?.label ?? statusFilter}`,
        onRemove:   () => onStatusChange('ALL'),
        colorClass: 'bg-green-50 text-green-700 border-green-200',
      });
    }

    if (serviceTypeFilter !== 'ALL') {
      chips.push({
        key:        'serviceType',
        label:      `Type: ${SERVICE_TYPE_OPTIONS.find(o => o.value === serviceTypeFilter)?.label ?? serviceTypeFilter}`,
        onRemove:   () => onServiceTypeChange('ALL'),
        colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      });
    }

    return chips;
  }, [statusFilter, serviceTypeFilter, onStatusChange, onServiceTypeChange]);

  const handleClearAll = useCallback(() => {
    onClearAll();
  }, [onClearAll]);

  return (
    <SearchFilterBar
      searchValue={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search by plate number, model, driver, route…"
      totalCount={totalCount}
      filteredCount={filteredCount}
      resultLabel="bus"
      loading={loading}
      filters={
        <>
          <SelectFilter
            value={statusFilter === 'ALL' ? 'all' : statusFilter}
            onChange={(v) => onStatusChange(v === 'all' ? 'ALL' : v as BusStatus)}
            options={STATUS_OPTIONS}
            allLabel="All Statuses"
            icon={<Activity className="h-3.5 w-3.5" />}
            activeColorClass="bg-green-50 border-green-300 text-green-800"
          />
          <SelectFilter
            value={serviceTypeFilter === 'ALL' ? 'all' : serviceTypeFilter}
            onChange={(v) => onServiceTypeChange(v === 'all' ? 'ALL' : v as BusServiceType)}
            options={SERVICE_TYPE_OPTIONS}
            allLabel="All Service Types"
            icon={<Bus className="h-3.5 w-3.5" />}
            activeColorClass="bg-indigo-50 border-indigo-300 text-indigo-800"
          />
        </>
      }
      activeChips={activeChips}
      onClearAllFilters={activeChips.length > 0 ? handleClearAll : undefined}
    />
  );
}
