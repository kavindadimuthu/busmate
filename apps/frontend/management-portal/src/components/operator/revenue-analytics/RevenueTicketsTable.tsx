'use client';

import React, { useMemo } from 'react';
import { Eye, FileText, Ticket } from 'lucide-react';
import { DataTable, EmptyState } from '@busmate/ui';
import type { ColumnDef, DataTableProps } from '@busmate/ui';
import type { TicketRecord } from '@/data/operator/revenue';

// ── Props ─────────────────────────────────────────────────────────

interface RevenueTicketsTableProps
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
  data: TicketRecord[];
  totalItems: number;
}

// ── Status badge ──────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  SOLD: 'bg-success/10 text-success border-success/20',
  REFUNDED: 'bg-warning/10 text-warning border-warning/20',
  CANCELLED: 'bg-destructive/10 text-destructive border-destructive/20',
};

const STATUS_LABELS: Record<string, string> = {
  SOLD: 'Sold',
  REFUNDED: 'Refunded',
  CANCELLED: 'Cancelled',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
        STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground border-border'
      }`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ── Payment method badge ──────────────────────────────────────────

const PAYMENT_STYLES: Record<string, string> = {
  CASH: 'bg-success/10 text-success',
  CARD: 'bg-primary/10 text-primary',
  QR: 'bg-[hsl(var(--purple-50))] text-[hsl(var(--purple-700))]',
  PASS: 'bg-warning/10 text-warning',
};

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Cash',
  CARD: 'Card',
  QR: 'QR',
  PASS: 'Pass',
};

function PaymentMethodBadge({ method }: { method: string }) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
        PAYMENT_STYLES[method] ?? 'bg-muted text-muted-foreground'
      }`}
    >
      {PAYMENT_LABELS[method] ?? method}
    </span>
  );
}

// ── Column definitions ────────────────────────────────────────────

function useTicketColumns(): ColumnDef<TicketRecord>[] {
  return useMemo(
    () => [
      {
        id: 'ticketId',
        header: 'Ticket ID',
        sortable: true,
        width: 'min-w-[140px]',
        cell: ({ row }) => (
          <span className="text-xs font-mono text-foreground/80">{row.ticketId}</span>
        ),
      },
      {
        id: 'issueDateTime',
        header: 'Date / Time',
        sortable: true,
        width: 'min-w-[140px]',
        cell: ({ row }) => {
          const dt = new Date(row.issueDateTime);
          return (
            <div>
              <p className="text-xs font-medium text-foreground">
                {dt.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-[10px] text-muted-foreground/70">
                {dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          );
        },
      },
      {
        id: 'busNumber',
        header: 'Bus',
        sortable: true,
        cell: ({ row }) => (
          <span className="text-xs font-medium text-foreground/80">{row.busNumber}</span>
        ),
      },
      {
        id: 'routeName',
        header: 'Route',
        sortable: true,
        width: 'min-w-[150px]',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{row.routeName}</span>
        ),
      },
      {
        id: 'conductorName',
        header: 'Conductor',
        sortable: true,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{row.conductorName}</span>
        ),
      },
      {
        id: 'pickupLocation',
        header: 'From → To',
        width: 'min-w-[160px]',
        cell: ({ row }) => (
          <div className="text-xs text-muted-foreground">
            <span>{row.pickupLocation}</span>
            <span className="text-muted-foreground/50 mx-1">→</span>
            <span>{row.dropOffLocation}</span>
          </div>
        ),
      },
      {
        id: 'distanceKm',
        header: 'Distance',
        sortable: true,
        align: 'right',
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-muted-foreground">
            {row.distanceKm.toFixed(1)} km
          </span>
        ),
      },
      {
        id: 'ticketPrice',
        header: 'Price',
        sortable: true,
        align: 'right',
        cell: ({ row }) => (
          <span className="text-xs font-semibold tabular-nums text-foreground">
            Rs {row.ticketPrice.toLocaleString()}
          </span>
        ),
      },
      {
        id: 'paymentMethod',
        header: 'Payment',
        sortable: true,
        cell: ({ row }) => <PaymentMethodBadge method={row.paymentMethod} />,
      },
      {
        id: 'status',
        header: 'Status',
        sortable: true,
        cell: ({ row }) => <StatusBadge status={row.status} />,
      },
    ],
    [],
  );
}

// ── Component ─────────────────────────────────────────────────────

/**
 * Sortable, paginated table displaying individual ticket records.
 *
 * Uses the shared `<DataTable>` component for consistent styling,
 * skeleton loading, and sort indicators.
 */
export function RevenueTicketsTable({
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
}: RevenueTicketsTableProps) {
  const columns = useTicketColumns();

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Ticket Records</h3>
          <p className="text-xs text-muted-foreground/70 mt-0.5">Detailed view of all ticket transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground bg-muted rounded-lg hover:bg-muted transition-colors">
            <FileText className="h-3 w-3" />
            Export CSV
          </button>
        </div>
      </div>

      <DataTable<TicketRecord>
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
        getRowId={(row) => row.ticketId}
        loading={loading}
        emptyState={
          <EmptyState
            icon={<Ticket className="h-8 w-8" />}
            title="No ticket records found"
            description="Try adjusting your search or filters."
          />
        }
      />
    </div>
  );
}
