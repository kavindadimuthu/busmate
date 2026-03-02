'use client';

import { useMemo } from 'react';
import { Navigation, Route as RouteIcon, MapPin, Eye, Edit2, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/shared/DataTable';
import type { DataTableColumn } from '@/components/shared/DataTable';
import type { RouteResponse } from '../../../../generated/api-clients/route-management';

// ── Types ─────────────────────────────────────────────────────────

interface RoutesTableProps {
  routes: RouteResponse[];
  onView: (routeId: string) => void;
  onEdit: (routeId: string) => void;
  onDelete: (routeId: string, routeName: string) => void;
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

// ── Main component ────────────────────────────────────────────────

/**
 * Routes data table.
 *
 * Delegates rendering to the shared `<DataTable>` component with
 * route-specific column definitions and custom cell renderers.
 */
export function RoutesTable({
  routes,
  onView,
  onEdit,
  onDelete,
  onSort,
  loading,
  currentSort,
}: RoutesTableProps) {
  const columns: DataTableColumn<RouteResponse>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Route Name',
        sortable: true,
        minWidth: 'min-w-[180px]',
        render: (route) => (
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center ring-1 ring-blue-200/60">
              <RouteIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                {route.name || 'Unnamed Route'}
              </p>
              {route.description && (
                <p
                  className="text-[11px] text-gray-400 leading-tight mt-0.5 truncate max-w-[200px]"
                  title={route.description}
                >
                  {route.description}
                </p>
              )}
            </div>
          </div>
        ),
      },
      {
        key: 'routeGroupName',
        header: 'Route Group',
        minWidth: 'min-w-[120px]',
        render: (route) =>
          route.routeGroupName ? (
            <span className="text-sm text-gray-700">{route.routeGroupName}</span>
          ) : (
            <span className="text-xs text-gray-300 italic">—</span>
          ),
      },
      {
        key: 'direction',
        header: 'Direction',
        sortable: true,
        cellClassName: 'whitespace-nowrap',
        render: (route) => {
          if (route.direction === 'OUTBOUND') {
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <Navigation className="w-3.5 h-3.5" />
                Outbound
              </span>
            );
          }
          if (route.direction === 'INBOUND') {
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                <Navigation className="w-3.5 h-3.5 rotate-180" />
                Inbound
              </span>
            );
          }
          return <span className="text-xs text-gray-300 italic">—</span>;
        },
      },
      {
        key: 'startStop',
        header: 'Route',
        minWidth: 'min-w-[220px]',
        render: (route) => (
          <div className="flex items-center gap-1.5 text-sm text-gray-700">
            <MapPin className="w-3.5 h-3.5 text-gray-300 shrink-0" />
            <span className="truncate max-w-[90px]" title={route.startStopName || undefined}>
              {route.startStopName || '—'}
            </span>
            <span className="text-gray-300 shrink-0">→</span>
            <span className="truncate max-w-[90px]" title={route.endStopName || undefined}>
              {route.endStopName || '—'}
            </span>
          </div>
        ),
      },
      {
        key: 'distanceKm',
        header: 'Distance',
        sortable: true,
        cellClassName: 'whitespace-nowrap',
        render: (route) =>
          route.distanceKm !== undefined && route.distanceKm !== null ? (
            <span className="text-sm text-gray-700 tabular-nums">
              {route.distanceKm.toFixed(1)}{' '}
              <span className="text-[11px] text-gray-400">km</span>
            </span>
          ) : (
            <span className="text-xs text-gray-300 italic">—</span>
          ),
      },
      {
        key: 'estimatedDurationMinutes',
        header: 'Duration',
        sortable: true,
        cellClassName: 'whitespace-nowrap',
        render: (route) =>
          route.estimatedDurationMinutes !== undefined && route.estimatedDurationMinutes !== null ? (
            <span className="text-sm text-gray-700 tabular-nums">
              {route.estimatedDurationMinutes}{' '}
              <span className="text-[11px] text-gray-400">min</span>
            </span>
          ) : (
            <span className="text-xs text-gray-300 italic">—</span>
          ),
      },
      {
        key: 'createdAt',
        header: 'Created',
        sortable: true,
        cellClassName: 'whitespace-nowrap',
        render: (route) => (
          <span className="text-xs text-gray-500 tabular-nums">{formatDate(route.createdAt)}</span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        headerClassName: 'text-center',
        cellClassName: 'text-center whitespace-nowrap',
        render: (route) => (
          <div className="inline-flex items-center gap-1">
            <button
              onClick={() => onView(route.id!)}
              title="View route"
              className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors duration-100"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onEdit(route.id!)}
              title="Edit route"
              className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors duration-100"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(route.id!, route.name || 'Unknown Route')}
              title="Delete route"
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
    <DataTable<RouteResponse>
      columns={columns}
      data={routes}
      loading={loading}
      currentSort={currentSort}
      onSort={onSort}
      rowKey={(route) => route.id!}
      showRefreshing
      emptyState={
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <RouteIcon className="w-7 h-7 text-blue-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No routes found</h3>
          <p className="text-sm text-gray-500 max-w-xs">
            Try adjusting your search or filters to find what you&apos;re looking for.
          </p>
        </div>
      }
    />
  );
}
