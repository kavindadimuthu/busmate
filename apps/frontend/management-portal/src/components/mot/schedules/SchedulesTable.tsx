'use client';

import React, { useMemo } from 'react';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  Edit2,
  Trash2,
  Users,
  Route as RouteIcon,
} from 'lucide-react';
import { ScheduleResponse } from '../../../../generated/api-clients/route-management/models/ScheduleResponse';
import { DataTable } from '@/components/shared/DataTable';
import type { DataTableColumn, SortState } from '@/components/shared/DataTable';

// ── Props ─────────────────────────────────────────────────────────

interface SchedulesTableProps {
  schedules: ScheduleResponse[];
  onView: (scheduleId: string) => void;
  onEdit: (scheduleId: string) => void;
  onDelete: (scheduleId: string, scheduleName: string) => void;
  onAssignBuses: (scheduleId: string, routeName: string) => void;
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

function getDaysOfWeek(scheduleCalendars?: any[]): string {
  if (!scheduleCalendars || scheduleCalendars.length === 0) return '—';
  const cal = scheduleCalendars[0];
  const days: string[] = [];
  if (cal?.monday)    days.push('Mon');
  if (cal?.tuesday)   days.push('Tue');
  if (cal?.wednesday) days.push('Wed');
  if (cal?.thursday)  days.push('Thu');
  if (cal?.friday)    days.push('Fri');
  if (cal?.saturday)  days.push('Sat');
  if (cal?.sunday)    days.push('Sun');
  return days.length > 0 ? days.join(', ') : '—';
}

function StatusBadge({ status }: { status?: string }) {
  const config: Record<string, { color: string; icon: React.ReactNode }> = {
    ACTIVE:    { color: 'bg-green-50 text-green-700 border-green-200',  icon: <CheckCircle className="w-3.5 h-3.5" /> },
    INACTIVE:  { color: 'bg-red-50 text-red-700 border-red-200',        icon: <XCircle className="w-3.5 h-3.5" /> },
    PENDING:   { color: 'bg-amber-50 text-amber-700 border-amber-200',  icon: <Clock className="w-3.5 h-3.5" /> },
    CANCELLED: { color: 'bg-gray-100 text-gray-600 border-gray-200',    icon: <XCircle className="w-3.5 h-3.5" /> },
  };
  const c = config[status ?? ''] ?? { color: 'bg-gray-100 text-gray-500 border-gray-200', icon: <AlertCircle className="w-3.5 h-3.5" /> };
  const label = status ? status.charAt(0) + status.slice(1).toLowerCase() : 'Unknown';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${c.color}`}>
      {c.icon}
      {label}
    </span>
  );
}

function TypeBadge({ type }: { type?: string }) {
  if (type === 'REGULAR') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
        <Calendar className="w-3 h-3" />
        Regular
      </span>
    );
  }
  if (type === 'SPECIAL') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
        <Users className="w-3 h-3" />
        Special
      </span>
    );
  }
  return <span className="text-xs text-gray-300 italic">—</span>;
}

// ── Main component ────────────────────────────────────────────────

/**
 * Schedule data table.
 *
 * Delegates rendering to the shared `<DataTable>` component with
 * schedule-specific column definitions and custom cell renderers.
 */
export function SchedulesTable({
  schedules,
  onView,
  onEdit,
  onDelete,
  onAssignBuses,
  onSort,
  activeFilters,
  loading,
  currentSort,
}: SchedulesTableProps) {

  const sortState: SortState = {
    field: currentSort.field,
    direction: currentSort.direction,
  };

  const columns: DataTableColumn<ScheduleResponse>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Schedule',
        sortable: true,
        minWidth: 'min-w-[180px]',
        render: (s) => (
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center ring-1 ring-blue-200/60">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                {s.name || 'Unnamed Schedule'}
              </p>
              {s.description && (
                <p className="text-[11px] text-gray-400 truncate leading-tight mt-0.5" title={s.description}>
                  {s.description}
                </p>
              )}
            </div>
          </div>
        ),
      },
      {
        key: 'routeName',
        header: 'Route',
        minWidth: 'min-w-[140px]',
        render: (s) => (
          <div className="flex items-start gap-1.5">
            <RouteIcon className="w-3.5 h-3.5 text-gray-300 mt-0.5 shrink-0" />
            <span className="text-sm text-gray-700 truncate">
              {s.routeName || '—'}
            </span>
          </div>
        ),
      },
      {
        key: 'scheduleType',
        header: 'Type',
        cellClassName: 'whitespace-nowrap',
        render: (s) => <TypeBadge type={s.scheduleType} />,
      },
      {
        key: 'status',
        header: 'Status',
        cellClassName: 'whitespace-nowrap',
        render: (s) => <StatusBadge status={s.status} />,
      },
      {
        key: 'operatingDays',
        header: 'Operating Days',
        cellClassName: 'whitespace-nowrap',
        render: (s) => (
          <span className="text-[11px] text-gray-400">{getDaysOfWeek(s.scheduleCalendars)}</span>
        ),
      },
      {
        key: 'effectiveStartDate',
        header: 'Effective Period',
        sortable: true,
        cellClassName: 'whitespace-nowrap',
        render: (s) => (
          <div className="space-y-0.5">
            <p className="text-xs text-gray-700 tabular-nums">
              {formatDate(s.effectiveStartDate)}
            </p>
            <p className="text-[11px] text-gray-400 tabular-nums">
              to {formatDate(s.effectiveEndDate)}
            </p>
          </div>
        ),
      },
      {
        key: 'createdAt',
        header: 'Created',
        sortable: true,
        cellClassName: 'whitespace-nowrap',
        render: (s) => (
          <span className="text-xs text-gray-500 tabular-nums">
            {formatDate(s.createdAt)}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        headerClassName: 'text-center',
        cellClassName: 'text-center whitespace-nowrap',
        render: (s) => (
          <div className="inline-flex items-center gap-1">
            <button
              onClick={() => onView(s.id!)}
              title="View details"
              className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors duration-100"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onEdit(s.id!)}
              title="Edit schedule"
              className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors duration-100"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onAssignBuses(s.id!, s.routeName || '')}
              title="Assign buses"
              className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 transition-colors duration-100"
            >
              <Users className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(s.id!, s.name || 'Unnamed Schedule')}
              title="Delete schedule"
              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors duration-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [onView, onEdit, onDelete, onAssignBuses],
  );

  return (
    <DataTable<ScheduleResponse>
      columns={columns}
      data={schedules}
      loading={loading}
      currentSort={sortState}
      onSort={onSort}
      rowKey={(s) => s.id!}
      showRefreshing
      emptyState={
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <Calendar className="w-7 h-7 text-blue-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No schedules found</h3>
          <p className="text-sm text-gray-500 max-w-xs">
            {Object.values(activeFilters).some(Boolean)
              ? 'Try adjusting your search or filters to find what you\'re looking for.'
              : 'No schedules have been created yet. Click "Add Schedule" to get started.'}
          </p>
        </div>
      }
    />
  );
}
