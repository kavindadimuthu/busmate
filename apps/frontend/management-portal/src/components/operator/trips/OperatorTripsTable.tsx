'use client';

import React, { useMemo } from 'react';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Bus,
  Eye,
  Navigation2,
  Users,
  MapPin,
  FileText,
} from 'lucide-react';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import type { OperatorTrip, TripStatus } from '@/data/operator/trips';

// ── Types ─────────────────────────────────────────────────────────

interface OperatorTripsTableProps {
  trips: OperatorTrip[];
  onView: (tripId: string) => void;
  onSort: (sortBy: string, sortDir: 'asc' | 'desc') => void;
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

function getStatusMeta(status?: TripStatus): {
  icon: React.ReactNode;
  label: string;
  colorClass: string;
} {
  switch (status) {
    case 'ACTIVE':
      return {
        icon: <CheckCircle className="w-3.5 h-3.5" />,
        label: 'Active',
        colorClass: 'bg-green-50 text-green-700 border-green-200',
      };
    case 'COMPLETED':
      return {
        icon: <CheckCircle className="w-3.5 h-3.5" />,
        label: 'Completed',
        colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    case 'PENDING':
      return {
        icon: <Clock className="w-3.5 h-3.5" />,
        label: 'Pending',
        colorClass: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      };
    case 'CANCELLED':
      return {
        icon: <XCircle className="w-3.5 h-3.5" />,
        label: 'Cancelled',
        colorClass: 'bg-red-50 text-red-600 border-red-200',
      };
    case 'DELAYED':
      return {
        icon: <AlertCircle className="w-3.5 h-3.5" />,
        label: 'Delayed',
        colorClass: 'bg-orange-50 text-orange-700 border-orange-200',
      };
    case 'IN_TRANSIT':
      return {
        icon: <Navigation2 className="w-3.5 h-3.5" />,
        label: 'In Transit',
        colorClass: 'bg-blue-50 text-blue-700 border-blue-200',
      };
    case 'BOARDING':
      return {
        icon: <Users className="w-3.5 h-3.5" />,
        label: 'Boarding',
        colorClass: 'bg-purple-50 text-purple-700 border-purple-200',
      };
    case 'DEPARTED':
      return {
        icon: <Navigation2 className="w-3.5 h-3.5" />,
        label: 'Departed',
        colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      };
    default:
      return {
        icon: <AlertCircle className="w-3.5 h-3.5" />,
        label: status ?? 'Unknown',
        colorClass: 'bg-gray-100 text-gray-600 border-gray-200',
      };
  }
}

// ── Component ─────────────────────────────────────────────────────

/**
 * Operator trip data table.
 *
 * Delegates rendering to the shared `<DataTable>` component with
 * operator-specific column definitions. Only a "View" action is shown
 * since operators cannot edit or delete trips.
 */
export function OperatorTripsTable({
  trips,
  onView,
  onSort,
  loading,
  currentSort,
}: OperatorTripsTableProps) {
  const columns: DataTableColumn<OperatorTrip>[] = useMemo(
    () => [
      // ── Trip Date ────────────────────────────────────────────
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
                {trip.tripNumber ?? `#${trip.id.slice(-8)}`}
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
        minWidth: 'min-w-[180px]',
        render: (trip) => (
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                {trip.routeName || '—'}
              </p>
              <p className="text-[11px] text-gray-400 leading-tight mt-0.5">
                {trip.routeOrigin} → {trip.routeDestination}
              </p>
            </div>
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

      // ── Departure / Arrival ───────────────────────────────────
      {
        key: 'scheduledDepartureTime',
        header: 'Departure',
        sortable: true,
        cellClassName: 'whitespace-nowrap',
        minWidth: 'min-w-[100px]',
        render: (trip) => (
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {formatTime(trip.scheduledDepartureTime)}
            </p>
            {trip.actualDepartureTime &&
              trip.actualDepartureTime !== trip.scheduledDepartureTime && (
                <p className="text-[11px] text-amber-600 mt-0.5">
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
        minWidth: 'min-w-[160px]',
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
                ? (trip.permitNumber ?? 'PSP Assigned')
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
              {trip.busId ? (trip.busRegistrationNumber ?? 'Bus Assigned') : 'No Bus'}
            </span>
          </div>
        ),
      },

      // ── Staff ─────────────────────────────────────────────────
      {
        key: 'staff',
        header: 'Staff',
        minWidth: 'min-w-[140px]',
        render: (trip) => (
          <div className="flex flex-col gap-0.5">
            {trip.driverName ? (
              <p className="text-xs text-gray-700 truncate max-w-[160px]">
                <span className="font-semibold text-gray-500">D:</span>{' '}
                {trip.driverName}
              </p>
            ) : (
              <p className="text-xs text-gray-400 italic">Driver unassigned</p>
            )}
            {trip.conductorName ? (
              <p className="text-xs text-gray-700 truncate max-w-[160px]">
                <span className="font-semibold text-gray-500">C:</span>{' '}
                {trip.conductorName}
              </p>
            ) : (
              <p className="text-xs text-gray-400 italic">Conductor unassigned</p>
            )}
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
          const { icon, label, colorClass } = getStatusMeta(trip.status as TripStatus);
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
          <button
            onClick={() => onView(trip.id)}
            title="View trip details"
            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors duration-100"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
        ),
      },
    ],
    [onView],
  );

  return (
    <DataTable<OperatorTrip>
      columns={columns}
      data={trips}
      loading={loading}
      currentSort={currentSort}
      onSort={onSort}
      rowKey={(trip) => trip.id}
      showRefreshing
      emptyState={
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <Calendar className="w-7 h-7 text-blue-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No trips found</h3>
          <p className="text-sm text-gray-500 max-w-xs">
            No trips match your current filters. Try adjusting your search criteria.
          </p>
        </div>
      }
    />
  );
}
