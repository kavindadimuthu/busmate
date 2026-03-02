'use client';

import React, { useMemo } from 'react';
import {
  Eye,
  Edit,
  Trash2,
  Building,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  MapPin,
  Users,
} from 'lucide-react';
import { DataTable } from '@/components/shared/DataTable';
import type { DataTableColumn, SortState } from '@/components/shared/DataTable';

// ── Types ─────────────────────────────────────────────────────────

interface OperatorTableData {
  id: string;
  name: string;
  operatorType?: string;
  region?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface OperatorsTableProps {
  operators: OperatorTableData[];
  onView: (operatorId: string) => void;
  onEdit: (operatorId: string) => void;
  onDelete: (operatorId: string, operatorName: string) => void;
  onSort: (sortBy: string, sortDir: 'asc' | 'desc') => void;
  activeFilters: Record<string, any>;
  loading: boolean;
  currentSort: SortState;
}

// ── Helpers ───────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-800 border-green-200',
  inactive: 'bg-red-100 text-red-800 border-red-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  active: <CheckCircle className="w-3.5 h-3.5" />,
  inactive: <XCircle className="w-3.5 h-3.5" />,
  pending: <Clock className="w-3.5 h-3.5" />,
  cancelled: <XCircle className="w-3.5 h-3.5" />,
};

const TYPE_STYLES: Record<string, string> = {
  PRIVATE: 'bg-blue-100 text-blue-800 border-blue-200',
  CTB: 'bg-green-100 text-green-800 border-green-200',
};

function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Invalid date';
  }
}

function formatTime(dateString?: string): string {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

// ── Component ─────────────────────────────────────────────────────

export function OperatorsTable({
  operators,
  onView,
  onEdit,
  onDelete,
  onSort,
  activeFilters,
  loading,
  currentSort,
}: OperatorsTableProps) {
  const columns = useMemo<DataTableColumn<OperatorTableData>[]>(
    () => [
      {
        key: 'name',
        header: 'Operator Name',
        sortable: true,
        minWidth: 'min-w-[200px]',
        render: (row) => (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <Building className="h-4.5 w-4.5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {row.name || 'Unnamed Operator'}
              </p>
              <p className="text-[11px] text-gray-400 truncate">ID: {row.id}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'operatorType',
        header: 'Type',
        cellClassName: 'whitespace-nowrap',
        render: (row) => (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              TYPE_STYLES[row.operatorType ?? ''] ?? 'bg-gray-100 text-gray-600 border-gray-200'
            }`}
          >
            {row.operatorType === 'CTB' ? (
              <Users className="w-3 h-3" />
            ) : (
              <Building className="w-3 h-3" />
            )}
            {row.operatorType === 'PRIVATE'
              ? 'Private'
              : row.operatorType === 'CTB'
                ? 'CTB'
                : 'Unknown'}
          </span>
        ),
      },
      {
        key: 'region',
        header: 'Region',
        minWidth: 'min-w-[120px]',
        render: (row) =>
          row.region ? (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-700 truncate">{row.region}</span>
            </div>
          ) : (
            <span className="text-xs text-gray-300 italic">—</span>
          ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => {
          const s = row.status ?? '';
          return (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                STATUS_STYLES[s] ?? 'bg-gray-100 text-gray-600 border-gray-200'
              }`}
            >
              {STATUS_ICONS[s] ?? <AlertCircle className="w-3.5 h-3.5" />}
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Unknown'}
            </span>
          );
        },
      },
      {
        key: 'createdAt',
        header: 'Created',
        sortable: true,
        minWidth: 'min-w-[120px]',
        render: (row) => (
          <div>
            <p className="text-xs text-gray-500">{formatDate(row.createdAt)}</p>
            <p className="text-[11px] text-gray-400">{formatTime(row.createdAt)}</p>
          </div>
        ),
      },
      {
        key: 'updatedAt',
        header: 'Updated',
        sortable: true,
        minWidth: 'min-w-[120px]',
        render: (row) => (
          <div>
            <p className="text-xs text-gray-500">{formatDate(row.updatedAt)}</p>
            <p className="text-[11px] text-gray-400">{formatTime(row.updatedAt)}</p>
          </div>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        headerClassName: 'text-center',
        cellClassName: 'text-center',
        render: (row) => (
          <div className="inline-flex items-center gap-1">
            <button
              onClick={() => onView(row.id)}
              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
              title="View details"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onEdit(row.id)}
              className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
              title="Edit"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(row.id, row.name || 'Unknown Operator')}
              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [onView, onEdit, onDelete],
  );

  const hasActiveFilters = Object.values(activeFilters).some(Boolean);

  return (
    <DataTable<OperatorTableData>
      columns={columns}
      data={operators}
      loading={loading}
      currentSort={currentSort}
      onSort={onSort}
      rowKey={(row) => row.id}
      showRefreshing={loading && operators.length > 0}
      emptyState={
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <Building className="w-7 h-7 text-blue-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No operators found</h3>
          <p className="text-sm text-gray-500 max-w-xs">
            {hasActiveFilters
              ? 'No operators match your current filters. Try adjusting your search criteria.'
              : 'No operators have been created yet.'}
          </p>
        </div>
      }
    />
  );
}
