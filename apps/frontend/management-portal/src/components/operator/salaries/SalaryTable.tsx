'use client';

import React, { useMemo } from 'react';
import { Banknote, Eye } from 'lucide-react';
import { DataTable, EmptyState } from '@busmate/ui';
import type { ColumnDef, DataTableProps } from '@busmate/ui';
import type { SalaryRecord } from '@/data/operator/salary';

// ── Props ─────────────────────────────────────────────────────────

interface SalaryTableProps
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
  data: SalaryRecord[];
  totalItems: number;
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
): ColumnDef<SalaryRecord>[] {
  return useMemo(
    () => [
      {
        id: 'periodStart',
        header: 'Date',
        sortable: true,
        width: 'min-w-[100px]',
        cell: ({ row }) => {
          const dt = new Date(row.periodStart);
          return (
            <span className="text-xs font-medium text-foreground">
              {dt.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
            </span>
          );
        },
      },
      {
        id: 'staffName',
        header: 'Staff Member',
        sortable: true,
        width: 'min-w-[160px]',
        cell: ({ row }) => (
          <div>
            <p className="text-xs font-medium text-foreground">{row.staffName}</p>
            <p className="text-[10px] text-muted-foreground/70">{row.staffId}</p>
          </div>
        ),
      },
      {
        id: 'role',
        header: 'Role',
        sortable: true,
        cell: ({ row }) => (
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
        id: 'busAssigned',
        header: 'Bus',
        sortable: true,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{row.busAssigned}</span>
        ),
      },
      {
        id: 'totalHours',
        header: 'Hours',
        sortable: true,
        align: 'right',
        cell: ({ row }) => (
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
        id: 'tripsCompleted',
        header: 'Trips',
        sortable: true,
        align: 'center',
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-foreground/80">{row.tripsCompleted}</span>
        ),
      },
      {
        id: 'performanceRating',
        header: 'Performance',
        sortable: true,
        cell: ({ row }) => (
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
        id: 'baseSalary',
        header: 'Base',
        sortable: true,
        align: 'right',
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-muted-foreground">
            Rs {row.baseSalary.toLocaleString()}
          </span>
        ),
      },
      {
        id: 'totalBonuses',
        header: 'Bonuses',
        sortable: true,
        align: 'right',
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-success">
            +Rs {row.totalBonuses.toLocaleString()}
          </span>
        ),
      },
      {
        id: 'totalDeductions',
        header: 'Deductions',
        sortable: true,
        align: 'right',
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-destructive">
            {row.totalDeductions > 0 ? `-Rs ${row.totalDeductions.toLocaleString()}` : '—'}
          </span>
        ),
      },
      {
        id: 'netSalary',
        header: 'Net Pay',
        sortable: true,
        align: 'right',
        cell: ({ row }) => (
          <span className="text-xs font-semibold tabular-nums text-foreground">
            Rs {row.netSalary.toLocaleString()}
          </span>
        ),
      },
      {
        id: 'paymentStatus',
        header: 'Status',
        sortable: true,
        cell: ({ row }) => <StatusBadge status={row.paymentStatus} />,
      },
      {
        id: 'actions',
        header: '',
        width: 'w-10',
        cell: ({ row }) => (
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
  totalItems,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sortColumn,
  sortDirection,
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
        totalItems={totalItems}
        page={page}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={onSort}
        getRowId={(row) => row.id}
        loading={loading}
        emptyState={
          <EmptyState
            icon={<Banknote className="h-8 w-8" />}
            title="No salary records found"
            description="Try adjusting your search or filters."
          />
        }
      />
    </div>
  );
}
