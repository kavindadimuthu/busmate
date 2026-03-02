'use client';

import React, { useMemo } from 'react';
import { Eye, FileText } from 'lucide-react';
import { DataTable, type DataTableColumn, type SortState } from '@/components/shared/DataTable';
import type { TicketRecord } from '@/data/operator/revenue';

// ── Props ─────────────────────────────────────────────────────────

interface RevenueTicketsTableProps {
  /** Paginated ticket records for the current page. */
  data: TicketRecord[];
  /** Show skeleton loading state. */
  loading: boolean;
  /** Current sort state. */
  currentSort: SortState;
  /** Callback when a sortable column header is clicked. */
  onSort: (field: string, direction: 'asc' | 'desc') => void;
}

// ── Status badge ──────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  SOLD: 'bg-green-50 text-green-700 border-green-200',
  REFUNDED: 'bg-amber-50 text-amber-700 border-amber-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
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
        STATUS_STYLES[status] ?? 'bg-gray-50 text-gray-600 border-gray-200'
      }`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ── Payment method badge ──────────────────────────────────────────

const PAYMENT_STYLES: Record<string, string> = {
  CASH: 'bg-emerald-50 text-emerald-700',
  CARD: 'bg-blue-50 text-blue-700',
  QR: 'bg-purple-50 text-purple-700',
  PASS: 'bg-amber-50 text-amber-700',
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
        PAYMENT_STYLES[method] ?? 'bg-gray-50 text-gray-600'
      }`}
    >
      {PAYMENT_LABELS[method] ?? method}
    </span>
  );
}

// ── Column definitions ────────────────────────────────────────────

function useTicketColumns(): DataTableColumn<TicketRecord>[] {
  return useMemo(
    () => [
      {
        key: 'ticketId',
        header: 'Ticket ID',
        sortable: true,
        minWidth: 'min-w-[140px]',
        render: (row) => (
          <span className="text-xs font-mono text-gray-700">{row.ticketId}</span>
        ),
      },
      {
        key: 'issueDateTime',
        header: 'Date / Time',
        sortable: true,
        minWidth: 'min-w-[140px]',
        render: (row) => {
          const dt = new Date(row.issueDateTime);
          return (
            <div>
              <p className="text-xs font-medium text-gray-800">
                {dt.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-[10px] text-gray-400">
                {dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          );
        },
      },
      {
        key: 'busNumber',
        header: 'Bus',
        sortable: true,
        render: (row) => (
          <span className="text-xs font-medium text-gray-700">{row.busNumber}</span>
        ),
      },
      {
        key: 'routeName',
        header: 'Route',
        sortable: true,
        minWidth: 'min-w-[150px]',
        render: (row) => (
          <span className="text-xs text-gray-600">{row.routeName}</span>
        ),
      },
      {
        key: 'conductorName',
        header: 'Conductor',
        sortable: true,
        render: (row) => (
          <span className="text-xs text-gray-600">{row.conductorName}</span>
        ),
      },
      {
        key: 'pickupLocation',
        header: 'From → To',
        minWidth: 'min-w-[160px]',
        render: (row) => (
          <div className="text-xs text-gray-600">
            <span>{row.pickupLocation}</span>
            <span className="text-gray-300 mx-1">→</span>
            <span>{row.dropOffLocation}</span>
          </div>
        ),
      },
      {
        key: 'distanceKm',
        header: 'Distance',
        sortable: true,
        cellClassName: 'text-right',
        headerClassName: 'text-right',
        render: (row) => (
          <span className="text-xs tabular-nums text-gray-600">
            {row.distanceKm.toFixed(1)} km
          </span>
        ),
      },
      {
        key: 'ticketPrice',
        header: 'Price',
        sortable: true,
        cellClassName: 'text-right',
        headerClassName: 'text-right',
        render: (row) => (
          <span className="text-xs font-semibold tabular-nums text-gray-900">
            Rs {row.ticketPrice.toLocaleString()}
          </span>
        ),
      },
      {
        key: 'paymentMethod',
        header: 'Payment',
        sortable: true,
        render: (row) => <PaymentMethodBadge method={row.paymentMethod} />,
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (row) => <StatusBadge status={row.status} />,
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
  currentSort,
  onSort,
}: RevenueTicketsTableProps) {
  const columns = useTicketColumns();

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Ticket Records</h3>
          <p className="text-xs text-gray-400 mt-0.5">Detailed view of all ticket transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <FileText className="h-3 w-3" />
            Export CSV
          </button>
        </div>
      </div>

      <DataTable<TicketRecord>
        columns={columns}
        data={data}
        loading={loading}
        currentSort={currentSort}
        onSort={onSort}
        rowKey={(row) => row.ticketId}
        skeletonRowCount={10}
      />
    </div>
  );
}
