'use client';

import React, { useMemo } from 'react';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Users,
  Bus,
  FileText,
  Trash2,
  Eye,
  Navigation2,
} from 'lucide-react';
import { TripResponse } from '../../../../generated/api-clients/route-management';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';

// ── Types ─────────────────────────────────────────────────────────

interface TripsTableProps {
  trips: TripResponse[];
  onView: (tripId: string) => void;
  onEdit: (tripId: string) => void;
  onDelete: (tripId: string, tripName: string) => void;
  onStart: (tripId: string) => void;
  onComplete: (tripId: string) => void;
  onCancel: (tripId: string, reason?: string) => void;
  onAssignPsp: (tripId: string) => void;
  onSort: (sortBy: string, sortDir: 'asc' | 'desc') => void;
  activeFilters: Record<string, any>;
  loading: boolean;
  currentSort: { field: string; direction: 'asc' | 'desc' };
}

// ── Helpers ───────────────────────────────────────────────────────

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

function formatTime(timeString?: string): string {
  if (!timeString) return '—';
  try {
    const timePart = timeString.includes('T') ? timeString.split('T')[1] : timeString;
    const [hours, minutes] = timePart.split(':');
    return `${hours}:${minutes}`;
  } catch {
    return '—';
  }
}

function getStatusMeta(status?: string): {
  icon: React.ReactNode;
  label: string;
  colorClass: string;
} {
  const s = status?.toLowerCase();
  switch (s) {
    case 'active':
      return { icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'Active',     colorClass: 'bg-green-50 text-green-700 border-green-200' };
    case 'completed':
      return { icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'Completed',  colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'pending':
      return { icon: <Clock className="w-3.5 h-3.5" />,       label: 'Pending',    colorClass: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
    case 'cancelled':
      return { icon: <XCircle className="w-3.5 h-3.5" />,     label: 'Cancelled',  colorClass: 'bg-red-50 text-red-600 border-red-200' };
    case 'delayed':
      return { icon: <AlertCircle className="w-3.5 h-3.5" />, label: 'Delayed',    colorClass: 'bg-orange-50 text-orange-700 border-orange-200' };
    case 'in_transit':
      return { icon: <Navigation2 className="w-3.5 h-3.5" />, label: 'In Transit', colorClass: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'boarding':
      return { icon: <Users className="w-3.5 h-3.5" />,       label: 'Boarding',   colorClass: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'departed':
      return { icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'Departed',   colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    default:
      return { icon: <AlertCircle className="w-3.5 h-3.5" />, label: status ?? 'Unknown', colorClass: 'bg-gray-100 text-gray-600 border-gray-200' };
  }
}

// ── Main component ────────────────────────────────────────────────

/**
 * Trip data table.
 *
 * Delegates rendering to the shared `<DataTable>` component with
 * trip-specific column definitions and custom cell renderers.
 */
export function TripsTable({
  trips,
  onView,
  onDelete,
  onSort,
  activeFilters,
  loading,
  currentSort,
}: TripsTableProps) {
  const columns: DataTableColumn<TripResponse>[] = useMemo(
    () => [
      // ── Trip Date ─────────────────────────────────────────────
      {
        key: 'tripDate',
        header: 'Trip Date',
        sortable: true,
        minWidth: 'min-w-[160px]',
        render: (trip) => (
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center ring-1 ring-blue-200/60">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                {formatDate(trip.tripDate)}
              </p>
              <p className="text-[11px] text-gray-400 font-mono leading-tight mt-0.5 truncate">
                #{trip.id?.slice(-8)}
              </p>
            </div>
          </div>
        ),
      },

      // ── Route ────────────────────────────────────────────────
      {
        key: 'routeName',
        header: 'Route',
        sortable: true,
        minWidth: 'min-w-[160px]',
        render: (trip) => (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
              {trip.routeName || '—'}
            </p>
            {trip.routeGroupName && (
              <p className="text-[11px] text-gray-400 truncate leading-tight mt-0.5">
                {trip.routeGroupName}
              </p>
            )}
          </div>
        ),
      },

      // ── Schedule ─────────────────────────────────────────────
      {
        key: 'scheduleName',
        header: 'Schedule',
        sortable: true,
        minWidth: 'min-w-[120px]',
        render: (trip) => (
          <span className="text-sm text-gray-700">{trip.scheduleName || '—'}</span>
        ),
      },

      // ── Operator ─────────────────────────────────────────────
      {
        key: 'operatorName',
        header: 'Operator',
        minWidth: 'min-w-[120px]',
        render: (trip) => (
          <span className="text-sm text-gray-700">{trip.operatorName || '—'}</span>
        ),
      },

      // ── Departure Time ────────────────────────────────────────
      {
        key: 'scheduledDepartureTime',
        header: 'Departure',
        cellClassName: 'whitespace-nowrap',
        minWidth: 'min-w-[100px]',
        render: (trip) => (
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {formatTime(trip.scheduledDepartureTime)}
            </p>
            {trip.actualDepartureTime && (
              <p className="text-[11px] text-gray-400 mt-0.5">
                Actual: {formatTime(trip.actualDepartureTime)}
              </p>
            )}
          </div>
        ),
      },

      // ── Assignments ───────────────────────────────────────────
      {
        key: 'assignments',
        header: 'Assignments',
        minWidth: 'min-w-[140px]',
        render: (trip) => (
          <div className="flex flex-col gap-1">
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                trip.passengerServicePermitId
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-gray-50 text-gray-400 border-gray-200'
              }`}
            >
              <FileText className="w-3 h-3 shrink-0" />
              {trip.passengerServicePermitId
                ? (trip.passengerServicePermitNumber ?? 'PSP Assigned')
                : 'No PSP'}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                trip.busId
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-gray-50 text-gray-400 border-gray-200'
              }`}
            >
              <Bus className="w-3 h-3 shrink-0" />
              {trip.busId ? (trip.busPlateNumber ?? 'Bus Assigned') : 'No Bus'}
            </span>
          </div>
        ),
      },

      // ── Status ────────────────────────────────────────────────
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        cellClassName: 'whitespace-nowrap',
        render: (trip) => {
          const { icon, label, colorClass } = getStatusMeta(trip.status);
          return (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${colorClass}`}
            >
              {icon}
              {label}
            </span>
          );
        },
      },

      // ── Actions ───────────────────────────────────────────────
      {
        key: 'actions',
        header: 'Actions',
        headerClassName: 'text-center',
        cellClassName: 'text-center whitespace-nowrap',
        render: (trip) => (
          <div className="inline-flex items-center gap-1">
            <button
              onClick={() => onView(trip.id ?? '')}
              title="View details"
              className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors duration-100"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            {['pending', 'cancelled'].includes(trip.status?.toLowerCase() ?? '') && (
              <button
                onClick={() =>
                  onDelete(
                    trip.id ?? '',
                    `${trip.routeName} - ${formatDate(trip.tripDate)}`
                  )
                }
                title="Delete trip"
                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors duration-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ),
      },
    ],
    [onView, onDelete],
  );

  return (
    <DataTable<TripResponse>
      columns={columns}
      data={trips}
      loading={loading}
      currentSort={currentSort}
      onSort={onSort}
      rowKey={(trip) => trip.id!}
      showRefreshing
      emptyState={
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <Calendar className="w-7 h-7 text-blue-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No trips found</h3>
          <p className="text-sm text-gray-500 max-w-xs">
            {Object.keys(activeFilters).length > 0
              ? 'No trips match your current filters. Try adjusting your search criteria.'
              : 'No trips have been created yet. Generate trips to get started.'}
          </p>
        </div>
      }
    />
  );
}