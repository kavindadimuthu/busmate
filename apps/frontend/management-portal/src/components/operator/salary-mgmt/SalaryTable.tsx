'use client';

import React, { useMemo } from 'react';
import { Eye } from 'lucide-react';
import { DataTable, type DataTableColumn, type SortState } from '@/components/shared/DataTable';
import type { SalaryRecord } from '@/data/operator/salary';

// ── Props ─────────────────────────────────────────────────────────

interface SalaryTableProps {
  /** Paginated salary records for the current page. */
  data: SalaryRecord[];
  /** Show skeleton loading state. */
  loading: boolean;
  /** Current sort state. */
  currentSort: SortState;
  /** Callback when a sortable column header is clicked. */
  onSort: (field: string, direction: 'asc' | 'desc') => void;
  /** Callback to view details of a salary record. */
  onViewDetail?: (record: SalaryRecord) => void;
}

// ── Badge helpers ─────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  PAID: 'bg-green-50 text-green-700 border-green-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  PROCESSING: 'bg-blue-50 text-blue-700 border-blue-200',
  FAILED: 'bg-red-50 text-red-700 border-red-200',
};

const ROLE_STYLES: Record<string, string> = {
  DRIVER: 'bg-blue-50 text-blue-700',
  CONDUCTOR: 'bg-purple-50 text-purple-700',
};

const PERF_STYLES: Record<string, string> = {
  EXCELLENT: 'bg-green-50 text-green-700',
  GOOD: 'bg-teal-50 text-teal-700',
  AVERAGE: 'bg-gray-100 text-gray-600',
  BELOW_AVERAGE: 'bg-red-50 text-red-600',
};

const PERF_LABELS: Record<string, string> = {
  EXCELLENT: 'Excellent',
  GOOD: 'Good',
  AVERAGE: 'Average',
  BELOW_AVERAGE: 'Below Avg',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
        STATUS_STYLES[status] ?? 'bg-gray-50 text-gray-600 border-gray-200'
      }`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ── Column definitions ────────────────────────────────────────────

function useSalaryColumns(
  onViewDetail?: (record: SalaryRecord) => void,
): DataTableColumn<SalaryRecord>[] {
  return useMemo(
    () => [
      {
        key: 'periodStart',
        header: 'Date',
        sortable: true,
        minWidth: 'min-w-[100px]',
        render: (row) => {
          const dt = new Date(row.periodStart);
          return (
            <span className="text-xs font-medium text-gray-800">
              {dt.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
            </span>
          );
        },
      },
      {
        key: 'staffName',
        header: 'Staff Member',
        sortable: true,
        minWidth: 'min-w-[160px]',
        render: (row) => (
          <div>
            <p className="text-xs font-medium text-gray-800">{row.staffName}</p>
            <p className="text-[10px] text-gray-400">{row.staffId}</p>
          </div>
        ),
      },
      {
        key: 'role',
        header: 'Role',
        sortable: true,
        render: (row) => (
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
              ROLE_STYLES[row.role] ?? ''
            }`}
          >
            {row.role === 'DRIVER' ? 'Driver' : 'Conductor'}
          </span>
        ),
      },
      {
        key: 'busAssigned',
        header: 'Bus',
        sortable: true,
        render: (row) => (
          <span className="text-xs text-gray-600">{row.busAssigned}</span>
        ),
      },
      {
        key: 'totalHours',
        header: 'Hours',
        sortable: true,
        cellClassName: 'text-right',
        headerClassName: 'text-right',
        render: (row) => (
          <div className="text-right">
            <span className="text-xs tabular-nums text-gray-700">{row.totalHours.toFixed(1)}h</span>
            {row.overtimeHours > 0 && (
              <span className="text-[10px] text-amber-600 ml-1">
                (+{row.overtimeHours}h OT)
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'tripsCompleted',
        header: 'Trips',
        sortable: true,
        cellClassName: 'text-center',
        headerClassName: 'text-center',
        render: (row) => (
          <span className="text-xs tabular-nums text-gray-700">{row.tripsCompleted}</span>
        ),
      },
      {
        key: 'performanceRating',
        header: 'Performance',
        sortable: true,
        render: (row) => (
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
              PERF_STYLES[row.performanceRating] ?? ''
            }`}
          >
            {PERF_LABELS[row.performanceRating] ?? row.performanceRating}
          </span>
        ),
      },
      {
        key: 'baseSalary',
        header: 'Base',
        sortable: true,
        cellClassName: 'text-right',
        headerClassName: 'text-right',
        render: (row) => (
          <span className="text-xs tabular-nums text-gray-600">
            Rs {row.baseSalary.toLocaleString()}
          </span>
        ),
      },
      {
        key: 'totalBonuses',
        header: 'Bonuses',
        sortable: true,
        cellClassName: 'text-right',
        headerClassName: 'text-right',
        render: (row) => (
          <span className="text-xs tabular-nums text-green-600">
            +Rs {row.totalBonuses.toLocaleString()}
          </span>
        ),
      },
      {
        key: 'totalDeductions',
        header: 'Deductions',
        sortable: true,
        cellClassName: 'text-right',
        headerClassName: 'text-right',
        render: (row) => (
          <span className="text-xs tabular-nums text-red-600">
            {row.totalDeductions > 0 ? `-Rs ${row.totalDeductions.toLocaleString()}` : '—'}
          </span>
        ),
      },
      {
        key: 'netSalary',
        header: 'Net Pay',
        sortable: true,
        cellClassName: 'text-right',
        headerClassName: 'text-right',
        render: (row) => (
          <span className="text-xs font-semibold tabular-nums text-gray-900">
            Rs {row.netSalary.toLocaleString()}
          </span>
        ),
      },
      {
        key: 'paymentStatus',
        header: 'Status',
        sortable: true,
        render: (row) => <StatusBadge status={row.paymentStatus} />,
      },
      {
        key: 'actions',
        header: '',
        headerClassName: 'w-10',
        render: (row) => (
          <button
            onClick={() => onViewDetail?.(row)}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="View details"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
        ),
      },
    ],
    [onViewDetail],
  );
}

// ── Component ─────────────────────────────────────────────────────

/**
 * Sortable data table for salary records.
 *
 * Displays daily salary entries with role, hours, performance,
 * salary breakdown, and payment status using the shared `<DataTable>`.
 */
export function SalaryTable({
  data,
  loading,
  currentSort,
  onSort,
  onViewDetail,
}: SalaryTableProps) {
  const columns = useSalaryColumns(onViewDetail);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900">Salary Records</h3>
        <p className="text-xs text-gray-400 mt-0.5">Daily salary details for all staff members</p>
      </div>

      <DataTable<SalaryRecord>
        columns={columns}
        data={data}
        loading={loading}
        currentSort={currentSort}
        onSort={onSort}
        rowKey={(row) => row.id}
        skeletonRowCount={10}
      />
    </div>
  );
}
