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
import { DataTable, EmptyState } from '@busmate/ui';
import type { ColumnDef, DataTableProps } from '@busmate/ui';
import type { OperatorTrip, TripStatus } from '@/data/operator/trips';

// ── Types ─────────────────────────────────────────────────────────

interface OperatorTripsTableProps
  extends Pick<
    DataTableProps<any>,
    | 'page'
    | 'pageSize'
    | 'onPageChange'
    | 'onPageSizeChange'
    | 'sortColumn'
    | 'sortDirection'
    | 'onSort'
    | 'loading'
  > {
  trips: OperatorTrip[];
  totalItems: number;
  onView: (tripId: string) => void;
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
        colorClass: 'bg-success/10 text-success border-success/20',
      };
    case 'COMPLETED':
      return {
        icon: <CheckCircle className="w-3.5 h-3.5" />,
        label: 'Completed',
        colorClass: 'bg-success/10 text-success border-success/20',
      };
    case 'PENDING':
      return {
        icon: <Clock className="w-3.5 h-3.5" />,
        label: 'Pending',
        colorClass: 'bg-warning/10 text-warning border-warning/20',
      };
    case 'CANCELLED':
      return {
        icon: <XCircle className="w-3.5 h-3.5" />,
        label: 'Cancelled',
        colorClass: 'bg-destructive/10 text-destructive border-destructive/20',
      };
    case 'DELAYED':
      return {
        icon: <AlertCircle className="w-3.5 h-3.5" />,
        label: 'Delayed',
        colorClass: 'bg-warning/10 text-orange-700 border-orange-200',
      };
    case 'IN_TRANSIT':
      return {
        icon: <Navigation2 className="w-3.5 h-3.5" />,
        label: 'In Transit',
        colorClass: 'bg-primary/10 text-primary border-primary/20',
      };
    case 'BOARDING':
      return {
        icon: <Users className="w-3.5 h-3.5" />,
        label: 'Boarding',
        colorClass: 'bg-[hsl(var(--purple-50))] text-[hsl(var(--purple-700))] border-[hsl(var(--purple-200))]',
      };
    case 'DEPARTED':
      return {
        icon: <Navigation2 className="w-3.5 h-3.5" />,
        label: 'Departed',
        colorClass: 'bg-primary/10 text-indigo-700 border-indigo-200',
      };
    default:
      return {
        icon: <AlertCircle className="w-3.5 h-3.5" />,
        label: status ?? 'Unknown',
        colorClass: 'bg-muted text-muted-foreground border-border',
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
  totalItems,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sortColumn,
  sortDirection,
  onSort,
  loading,
  onView,
}: OperatorTripsTableProps) {
  const columns: ColumnDef<OperatorTrip>[] = useMemo(
    () => [
      // ── Trip Date ────────────────────────────────────────────
      {
        id: 'tripDate',
        header: 'Trip Date',
        sortable: true,
        width: 'min-w-[160px]',
        cell: ({ row: trip }) => (
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center ring-1 ring-blue-200/60">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate leading-tight">
                {formatDate(trip.tripDate)}
              </p>
              <p className="text-[11px] text-muted-foreground/70 font-mono leading-tight mt-0.5 truncate">
                {trip.tripNumber ?? `#${trip.id.slice(-8)}`}
              </p>
            </div>
          </div>
        ),
      },

      // ── Route ────────────────────────────────────────────────
      {
        id: 'routeName',
        header: 'Route',
        sortable: true,
        width: 'min-w-[180px]',
        cell: ({ row: trip }) => (
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="w-4 h-4 text-primary/70 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate leading-tight">
                {trip.routeName || '—'}
              </p>
              <p className="text-[11px] text-muted-foreground/70 leading-tight mt-0.5">
                {trip.routeOrigin} → {trip.routeDestination}
              </p>
            </div>
          </div>
        ),
      },

      // ── Schedule ─────────────────────────────────────────────
      {
        id: 'scheduleName',
        header: 'Schedule',
        sortable: true,
        width: 'min-w-[120px]',
        cell: ({ row: trip }) => (
          <span className="text-sm text-foreground/80">{trip.scheduleName || '—'}</span>
        ),
      },

      // ── Departure / Arrival ───────────────────────────────────
      {
        id: 'scheduledDepartureTime',
        header: 'Departure',
        sortable: true,
        width: 'min-w-[100px]',
        cell: ({ row: trip }) => (
          <div>
            <p className="text-sm font-semibold text-foreground">
              {formatTime(trip.scheduledDepartureTime)}
            </p>
            {trip.actualDepartureTime &&
              trip.actualDepartureTime !== trip.scheduledDepartureTime && (
                <p className="text-[11px] text-warning mt-0.5">
                  Actual: {formatTime(trip.actualDepartureTime)}
                </p>
              )}
          </div>
        ),
      },

      // ── Assignments ───────────────────────────────────────────
      {
        id: 'assignments',
        header: 'Assignments',
        width: 'min-w-[160px]',
        cell: ({ row: trip }) => (
          <div className="flex flex-col gap-1">
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                trip.passengerServicePermitId
                  ? 'bg-success/10 text-success border-success/20'
                  : 'bg-muted text-muted-foreground/70 border-border'
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
                  ? 'bg-primary/10 text-primary border-primary/20'
                  : 'bg-muted text-muted-foreground/70 border-border'
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
        id: 'staff',
        header: 'Staff',
        width: 'min-w-[140px]',
        cell: ({ row: trip }) => (
          <div className="flex flex-col gap-0.5">
            {trip.driverName ? (
              <p className="text-xs text-foreground/80 truncate max-w-[160px]">
                <span className="font-semibold text-muted-foreground">D:</span>{' '}
                {trip.driverName}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground/70 italic">Driver unassigned</p>
            )}
            {trip.conductorName ? (
              <p className="text-xs text-foreground/80 truncate max-w-[160px]">
                <span className="font-semibold text-muted-foreground">C:</span>{' '}
                {trip.conductorName}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground/70 italic">Conductor unassigned</p>
            )}
          </div>
        ),
      },

      // ── Status ────────────────────────────────────────────────
      {
        id: 'status',
        header: 'Status',
        sortable: true,
        cell: ({ row: trip }) => {
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
        id: 'actions',
        header: 'Actions',
        align: 'center',
        cell: ({ row: trip }) => (
          <button
            onClick={() => onView(trip.id)}
            title="View trip details"
            className="p-1.5 rounded-lg text-primary/80 hover:bg-primary/10 transition-colors duration-100"
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
      totalItems={totalItems}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSort={onSort}
      getRowId={(trip) => trip.id}
      loading={loading}
      emptyState={
        <EmptyState
          icon={<Calendar className="h-8 w-8" />}
          title="No trips found"
          description="No trips match your current filters. Try adjusting your search criteria."
        />
      }
    />
  );
}
