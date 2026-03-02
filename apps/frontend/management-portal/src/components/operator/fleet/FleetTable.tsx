'use client';

import React from 'react';
import {
  Eye, Bus, CheckCircle, XCircle, Wrench, AlertCircle, MapPin, User,
} from 'lucide-react';
import { DataTable, type DataTableColumn, type SortState } from '@/components/shared/DataTable';
import type { OperatorBus } from '@/data/operator/buses';

// ── Types ─────────────────────────────────────────────────────────

interface FleetTableProps {
  buses: OperatorBus[];
  onView: (busId: string) => void;
  onSort: (field: string, direction: 'asc' | 'desc') => void;
  currentSort: SortState;
  loading: boolean;
  hasActiveFilters: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; icon: React.ReactNode; classes: string }> = {
  ACTIVE:      { label: 'Active',      icon: <CheckCircle className="w-3.5 h-3.5" />, classes: 'bg-green-100 text-green-800 border-green-200'  },
  INACTIVE:    { label: 'Inactive',    icon: <XCircle     className="w-3.5 h-3.5" />, classes: 'bg-orange-100 text-orange-800 border-orange-200' },
  MAINTENANCE: { label: 'Maintenance', icon: <Wrench      className="w-3.5 h-3.5" />, classes: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  RETIRED:     { label: 'Retired',     icon: <AlertCircle className="w-3.5 h-3.5" />, classes: 'bg-gray-100 text-gray-600 border-gray-200'       },
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  SL:          'SL',
  SL_AC:       'SL A/C',
  SEMI_LUXURY: 'Semi-Luxury',
  LUXURY:      'Luxury',
  EXPRESS:     'Express',
};

// ── Component ─────────────────────────────────────────────────────

export function FleetTable({
  buses,
  onView,
  onSort,
  currentSort,
  loading,
  hasActiveFilters,
}: FleetTableProps) {
  const columns: DataTableColumn<OperatorBus>[] = [
    {
      key:      'plateNumber',
      header:   'Plate / Reg.',
      sortable: true,
      minWidth: 'min-w-[140px]',
      render: (bus) => (
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center ring-1 ring-blue-200/60">
            <Bus className="w-4 h-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
              {bus.plateNumber}
            </p>
            <p className="text-[11px] text-gray-400 font-mono leading-tight mt-0.5 truncate">
              {bus.ntcRegistrationNumber}
            </p>
          </div>
        </div>
      ),
    },
    {
      key:      'model',
      header:   'Model',
      sortable: true,
      minWidth: 'min-w-[140px]',
      render: (bus) => (
        <div>
          <div className="text-gray-700">{bus.model}</div>
          <div className="text-xs text-gray-400">{bus.manufacturer}</div>
        </div>
      ),
    },
    {
      key:      'serviceType',
      header:   'Service Type',
      sortable: true,
      render: (bus) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
          {SERVICE_TYPE_LABELS[bus.serviceType] ?? bus.serviceType}
        </span>
      ),
    },
    {
      key:      'year',
      header:   'Year',
      sortable: true,
      render: (bus) => <span className="text-gray-600">{bus.year}</span>,
    },
    {
      key:      'seatingCapacity',
      header:   'Seats',
      sortable: true,
      render: (bus) => <span className="text-gray-600">{bus.seatingCapacity}</span>,
    },
    {
      key:      'status',
      header:   'Status',
      sortable: true,
      render: (bus) => {
        const meta = STATUS_META[bus.status] ?? STATUS_META.RETIRED;
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${meta.classes}`}>
            {meta.icon}
            {meta.label}
          </span>
        );
      },
    },
    {
      key:    'driver',
      header: 'Driver',
      render: (bus) =>
        bus.driver ? (
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="text-gray-700 truncate max-w-[130px]">{bus.driver.driverName}</span>
          </div>
        ) : (
          <span className="text-gray-400 italic text-xs">Unassigned</span>
        ),
    },
    {
      key:    'route',
      header: 'Route',
      render: (bus) =>
        bus.routeAssignments[0] ? (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="text-gray-700 truncate max-w-[160px]">
              {bus.routeAssignments[0].routeName}
            </span>
          </div>
        ) : (
          <span className="text-gray-400 italic text-xs">No route</span>
        ),
    },
    {
      key:             'actions',
      header:          'Actions',
      headerClassName: 'text-center',
      cellClassName: 'text-center whitespace-nowrap',
      render: (bus) => (
        <button
          onClick={() => onView(bus.id)}
          title="View bus details"
          className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors duration-100"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ];

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Bus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <h3 className="text-base font-semibold text-gray-900 mb-1">
        {hasActiveFilters ? 'No buses match your filters' : 'No buses in fleet'}
      </h3>
      <p className="text-sm text-gray-500">
        {hasActiveFilters
          ? 'Try adjusting your search or filters.'
          : 'No buses have been registered in this fleet yet.'}
      </p>
    </div>
  );

  return (
    <DataTable<OperatorBus>
      columns={columns}
      data={buses}
      loading={loading}
      skeletonRowCount={8}
      currentSort={currentSort}
      onSort={onSort}
      rowKey={(bus) => bus.id}
      emptyState={emptyState}
      showRefreshing
    />
  );
}
