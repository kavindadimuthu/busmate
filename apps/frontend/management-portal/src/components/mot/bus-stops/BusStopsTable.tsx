'use client';

import React, { useMemo } from 'react';
import {
  Eye,
  Edit2,
  Trash2,
  MapPin,
  CheckCircle2,
  XCircle,
  Navigation2,
} from 'lucide-react';
import { DataTable } from '@/components/shared/DataTable';
import type { DataTableColumn } from '@/components/shared/DataTable';
import type { StopResponse } from '../../../../generated/api-clients/route-management';

interface BusStopsTableProps {
  busStops: StopResponse[];
  onView: (stopId: string) => void;
  onEdit: (stopId: string) => void;
  onDelete: (stopId: string, stopName: string) => void;
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

function formatLocation(location?: any): { primary: string; secondary?: string } {
  if (!location) return { primary: '—' };
  const cityState = [location.city, location.state].filter(Boolean).join(', ');
  const address = location.address || '';
  if (cityState && address) return { primary: cityState, secondary: address };
  if (cityState) return { primary: cityState };
  if (address) return { primary: address };
  if (location.latitude != null && location.longitude != null) {
    return { primary: `${Number(location.latitude).toFixed(4)}, ${Number(location.longitude).toFixed(4)}` };
  }
  return { primary: '—' };
}

// ── Main component ────────────────────────────────────────────────

/**
 * Bus-stop data table.
 *
 * Delegates rendering to the shared `<DataTable>` component with
 * bus-stop-specific column definitions and custom cell renderers.
 */
export function BusStopsTable({
  busStops,
  onView,
  onEdit,
  onDelete,
  onSort,
  loading,
  currentSort,
}: BusStopsTableProps) {
  const columns: DataTableColumn<StopResponse>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Stop Name',
        sortable: true,
        minWidth: 'min-w-[160px]',
        render: (stop) => (
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center ring-1 ring-blue-200/60">
              <MapPin className="w-4 h-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                {stop.name || 'Unnamed Stop'}
              </p>
              <p className="text-[11px] text-gray-400 font-mono leading-tight mt-0.5 truncate">
                #{stop.id?.slice(0, 8)}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: 'location',
        header: 'Location',
        minWidth: 'min-w-[140px]',
        render: (stop) => {
          const loc = formatLocation(stop.location);
          return (
            <div className="flex items-start gap-1.5">
              <Navigation2 className="w-3.5 h-3.5 text-gray-300 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-gray-700 truncate leading-tight">{loc.primary}</p>
                {loc.secondary && (
                  <p className="text-[11px] text-gray-400 truncate leading-tight mt-0.5" title={loc.secondary}>
                    {loc.secondary}
                  </p>
                )}
              </div>
            </div>
          );
        },
      },
      {
        key: 'isAccessible',
        header: 'Accessibility',
        sortable: true,
        cellClassName: 'whitespace-nowrap',
        render: (stop) =>
          stop.isAccessible ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Accessible
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-600 border border-red-200">
              <XCircle className="w-3.5 h-3.5" />
              Not Accessible
            </span>
          ),
      },
      {
        key: 'description',
        header: 'Description',
        cellClassName: 'max-w-[200px]',
        render: (stop) =>
          stop.description ? (
            <p className="text-sm text-gray-600 truncate" title={stop.description}>
              {stop.description}
            </p>
          ) : (
            <span className="text-xs text-gray-300 italic">—</span>
          ),
      },
      {
        key: 'createdAt',
        header: 'Created',
        sortable: true,
        cellClassName: 'whitespace-nowrap',
        render: (stop) => (
          <span className="text-xs text-gray-500 tabular-nums">
            {formatDate(stop.createdAt)}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        headerClassName: 'text-center',
        cellClassName: 'text-center whitespace-nowrap',
        render: (stop) => (
          <div className="inline-flex items-center gap-1">
            <button
              onClick={() => onView(stop.id!)}
              title="View details"
              className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors duration-100"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onEdit(stop.id!)}
              title="Edit stop"
              className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors duration-100"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(stop.id!, stop.name || 'Unknown Stop')}
              title="Delete stop"
              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors duration-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [onView, onEdit, onDelete],
  );

  return (
    <DataTable<StopResponse>
      columns={columns}
      data={busStops}
      loading={loading}
      currentSort={currentSort}
      onSort={onSort}
      rowKey={(stop) => stop.id!}
      showRefreshing
      emptyState={
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <MapPin className="w-7 h-7 text-blue-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No bus stops found</h3>
          <p className="text-sm text-gray-500 max-w-xs">
            Try adjusting your search or filters to find what you&apos;re looking for.
          </p>
        </div>
      }
    />
  );
}