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
  PAID: 'bg-success/10 text-success border-success/20',
  PENDING: 'bg-warning/10 text-warning border-warning/20',
  PROCESSING: 'bg-primary/10 text-primary border-primary/20',
  FAILED: 'bg-destructive/10 text-destructive border-destructive/20',
};

const ROLE_STYLES: Record<string, string> = {
  DRIVER: 'bg-primary/10 text-primary',
  CONDUCTOR: 'bg-[hsl(var(--purple-50))] text-[hsl(var(--purple-700))]',
};

const PERF_STYLES: Record<string, string> = {
  EXCELLENT: 'bg-success/10 text-success',
  GOOD: 'bg-primary/10 text-teal-700',
  AVERAGE: 'bg-muted text-muted-foreground',
  BELOW_AVERAGE: 'bg-destructive/10 text-destructive',
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
        STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground border-border'
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
            <span className="text-xs font-medium text-foreground">
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
            <p className="text-xs font-medium text-foreground">{row.staffName}</p>
            <p className="text-[10px] text-muted-foreground/70">{row.staffId}</p>
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
          <span className="text-xs text-muted-foreground">{row.busAssigned}</span>
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
            <span className="text-xs tabular-nums text-foreground/80">{row.totalHours.toFixed(1)}h</span>
            {row.overtimeHours > 0 && (
              <span className="text-[10px] text-warning ml-1">
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
          <span className="text-xs tabular-nums text-foreground/80">{row.tripsCompleted}</span>
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
          <span className="text-xs tabular-nums text-muted-foreground">
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
          <span className="text-xs tabular-nums text-success">
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
          <span className="text-xs tabular-nums text-destructive">
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
          <span className="text-xs font-semibold tabular-nums text-foreground">
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
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-muted-foreground/70 hover:text-primary hover:bg-primary/10 transition-colors"
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
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border/50">
        <h3 className="text-base font-semibold text-foreground">Salary Records</h3>
        <p className="text-xs text-muted-foreground/70 mt-0.5">Daily salary details for all staff members</p>
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
