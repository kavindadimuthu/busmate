'use client';

import React, { useMemo } from 'react';
import {
  Bus,
  Users,
  Eye,
  Edit,
  Trash2,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { DataTable } from '@/components/shared/DataTable';
import type { DataTableColumn, SortState } from '@/components/shared/DataTable';

// ── Types ─────────────────────────────────────────────────────────

interface BusesTableProps {
  buses: any[];
  onView: (busId: string) => void;
  onEdit: (busId: string) => void;
  onDelete: (busId: string, busRegistration: string) => void;
  onAssignRoute?: (busId: string, busRegistration: string) => void;
  onSort: (sortBy: string, sortDir: 'asc' | 'desc') => void;
  activeFilters: Record<string, any>;
  loading: boolean;
  currentSort: { field: string; direction: 'asc' | 'desc' };
}

// ── Helpers ───────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:    'bg-green-50 text-green-700 border-green-200',
  INACTIVE:  'bg-red-50 text-red-700 border-red-200',
  PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
  CANCELLED: 'bg-gray-100 text-gray-600 border-gray-200',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  ACTIVE:    <CheckCircle className="w-3.5 h-3.5" />,
  INACTIVE:  <XCircle className="w-3.5 h-3.5" />,
  PENDING:   <Clock className="w-3.5 h-3.5" />,
  CANCELLED: <XCircle className="w-3.5 h-3.5" />,
};

function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

// ── Component ─────────────────────────────────────────────────────

export function BusesTable({
  buses,
  onView,
  onEdit,
  onDelete,
  onAssignRoute,
  onSort,
  activeFilters,
  loading,
  currentSort,
}: BusesTableProps) {
  const columns = useMemo<DataTableColumn<any>[]>(
    () => [
      {
        key: 'ntcRegistrationNumber',
        header: 'Registration',
        sortable: true,
        minWidth: 'min-w-[180px]',
        render: (bus) => (
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center ring-1 ring-blue-200/60">
              <Bus className="w-4 h-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                {bus.ntcRegistrationNumber || bus.ntc_registration_number || 'N/A'}
              </p>
              <p className="text-[11px] text-gray-400 font-mono leading-tight mt-0.5 truncate">
                #{bus.id?.slice(0, 8)}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: 'plateNumber',
        header: 'Plate Number',
        sortable: true,
        cellClassName: 'whitespace-nowrap',
        render: (bus) => (
          <span className="text-sm text-gray-700 font-mono">
            {bus.plateNumber || bus.plate_number || '—'}
          </span>
        ),
      },
      {
        key: 'operator.name',
        header: 'Operator',
        sortable: true,
        minWidth: 'min-w-[140px]',
        render: (bus) => (
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <span className="text-sm text-gray-900 truncate">
              {bus.operator?.name || bus.operatorName || 'Unknown'}
            </span>
          </div>
        ),
      },
      {
        key: 'model',
        header: 'Model',
        sortable: true,
        render: (bus) => (
          <span className="text-sm text-gray-700">{bus.model || '—'}</span>
        ),
      },
      {
        key: 'capacity',
        header: 'Capacity',
        sortable: true,
        cellClassName: 'whitespace-nowrap',
        render: (bus) => (
          <span className="text-sm text-gray-700 tabular-nums">
            {bus.capacity ?? '—'}
            {bus.capacity != null && (
              <span className="text-[11px] text-gray-400 ml-0.5">seats</span>
            )}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        cellClassName: 'whitespace-nowrap',
        render: (bus) => {
          const s = (bus.status ?? '').toUpperCase();
          return (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                STATUS_STYLES[s] ?? 'bg-gray-100 text-gray-600 border-gray-200'
              }`}
            >
              {STATUS_ICONS[s] ?? <AlertTriangle className="w-3.5 h-3.5" />}
              {s ? s.charAt(0) + s.slice(1).toLowerCase() : 'Unknown'}
            </span>
          );
        },
      },
      {
        key: 'createdAt',
        header: 'Created',
        sortable: true,
        cellClassName: 'whitespace-nowrap',
        render: (bus) => (
          <span className="text-xs text-gray-500 tabular-nums">
            {formatDate(bus.createdAt || bus.created_at)}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        headerClassName: 'text-center',
        cellClassName: 'text-center whitespace-nowrap',
        render: (bus) => (
          <div className="inline-flex items-center gap-1">
            <button
              onClick={() => onView(bus.id)}
              className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors duration-100"
              title="View Details"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onEdit(bus.id)}
              className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors duration-100"
              title="Edit Bus"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
            {onAssignRoute && (
              <button
                onClick={() =>
                  onAssignRoute(
                    bus.id,
                    bus.ntcRegistrationNumber || bus.ntc_registration_number || 'Unknown',
                  )
                }
                className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 transition-colors duration-100"
                title="Assign to Route"
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() =>
                onDelete(
                  bus.id,
                  bus.ntcRegistrationNumber || bus.ntc_registration_number || 'Unknown',
                )
              }
              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors duration-100"
              title="Delete Bus"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [onView, onEdit, onDelete, onAssignRoute],
  );

  const hasActiveFilters = Object.values(activeFilters).some(Boolean);

  return (
    <DataTable
      columns={columns}
      data={buses}
      loading={loading}
      currentSort={currentSort as SortState}
      onSort={onSort}
      rowKey={(bus) => bus.id}
      showRefreshing={loading && buses.length > 0}
      emptyState={
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <Bus className="w-7 h-7 text-blue-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No buses found</h3>
          <p className="text-sm text-gray-500 max-w-xs">
            {hasActiveFilters
              ? 'No buses match your current filters. Try adjusting your search criteria.'
              : 'No buses have been registered yet.'}
          </p>
        </div>
      }
    />
  );
}
