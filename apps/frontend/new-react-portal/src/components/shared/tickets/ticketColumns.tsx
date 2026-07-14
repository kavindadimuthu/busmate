'use client';

import * as React from 'react';
import { Ticket, CheckCircle, XCircle, Clock, AlertTriangle, CreditCard, Banknote } from 'lucide-react';
import type { ColumnDef } from '@busmate/ui';
import type { ConductorLogTicketDTO } from '@busmate/api-client-ticketing';

function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

const STATUS_META: Record<string, { label: string; icon: React.ReactNode; classes: string }> = {
  BOARDED: { label: 'Boarded', icon: <CheckCircle className="w-3.5 h-3.5" />, classes: 'bg-success/15 text-success border-success/20' },
  CONFIRMED: { label: 'Confirmed', icon: <CheckCircle className="w-3.5 h-3.5" />, classes: 'bg-primary/10 text-primary border-primary/20' },
  PENDING_PAYMENT: { label: 'Pending Payment', icon: <Clock className="w-3.5 h-3.5" />, classes: 'bg-warning/15 text-warning border-warning/20' },
  PAYMENT_FAILED: { label: 'Payment Failed', icon: <AlertTriangle className="w-3.5 h-3.5" />, classes: 'bg-destructive/10 text-destructive border-destructive/20' },
  CANCELLED: { label: 'Cancelled', icon: <XCircle className="w-3.5 h-3.5" />, classes: 'bg-muted text-muted-foreground border-border' },
};

export const ticketColumns: ColumnDef<ConductorLogTicketDTO>[] = [
  {
    id: 'ticketId',
    header: 'Ticket',
    sortable: true,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
          <Ticket className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate leading-tight">#{row.ticketId}</p>
          <p className="text-[11px] text-muted-foreground/70 leading-tight mt-0.5">{formatDateTime(row.issuedAt)}</p>
        </div>
      </div>
    ),
  },
  {
    id: 'passengerId',
    header: 'Passenger / Seat',
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="text-sm text-foreground truncate">{row.passengerId || 'Walk-in'}</p>
        <p className="text-[11px] text-muted-foreground/70">Seat {row.seatNumber || '—'}</p>
      </div>
    ),
  },
  {
    id: 'busId',
    header: 'Bus / Trip',
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="text-xs font-mono text-foreground/80 truncate max-w-[140px]" title={row.busId}>{row.busId}</p>
        <p className="text-[11px] font-mono text-muted-foreground/70 truncate max-w-[140px]" title={row.tripId}>{row.tripId}</p>
      </div>
    ),
  },
  {
    id: 'issueMethod',
    header: 'Method',
    cell: ({ row }) => (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-muted text-foreground/80 border-border">
        {row.issueMethod === 'ONLINE' ? <CreditCard className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
        {row.issueMethod === 'ONLINE' ? 'Online' : 'Cash'}
      </span>
    ),
  },
  {
    id: 'fareAmount',
    header: 'Fare',
    sortable: true,
    cell: ({ row }) => <span className="text-sm font-semibold text-foreground">Rs. {(row.fareAmount ?? 0).toLocaleString()}</span>,
  },
  {
    id: 'bookingStatus',
    header: 'Status',
    cell: ({ row }) => {
      const meta = STATUS_META[row.bookingStatus ?? ''] ?? STATUS_META.CONFIRMED;
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${meta.classes}`}>
          {meta.icon}
          {meta.label}
        </span>
      );
    },
  },
];
