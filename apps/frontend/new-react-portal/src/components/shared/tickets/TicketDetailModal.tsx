'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@busmate/ui';
import { CheckCircle, XCircle, Clock, AlertTriangle, Ticket as TicketIcon, CreditCard, Banknote } from 'lucide-react';
import type { ConductorLogTicketDTO } from '@busmate/api-client-ticketing';

interface TicketDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: ConductorLogTicketDTO | undefined;
}

const STATUS_META: Record<string, { label: string; icon: React.ReactNode; classes: string }> = {
  BOARDED: { label: 'Boarded', icon: <CheckCircle className="w-4 h-4" />, classes: 'bg-success/15 text-success border-success/20' },
  CONFIRMED: { label: 'Confirmed', icon: <CheckCircle className="w-4 h-4" />, classes: 'bg-primary/10 text-primary border-primary/20' },
  PENDING_PAYMENT: { label: 'Pending Payment', icon: <Clock className="w-4 h-4" />, classes: 'bg-warning/15 text-warning border-warning/20' },
  PAYMENT_FAILED: { label: 'Payment Failed', icon: <AlertTriangle className="w-4 h-4" />, classes: 'bg-destructive/10 text-destructive border-destructive/20' },
  CANCELLED: { label: 'Cancelled', icon: <XCircle className="w-4 h-4" />, classes: 'bg-muted text-muted-foreground border-border' },
};

function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-2 py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value}</span>
    </div>
  );
}

/** Shared ticket detail popup used by both the operator and MOT Tickets pages. */
export function TicketDetailModal({ open, onOpenChange, ticket }: TicketDetailModalProps) {
  if (!ticket) return null;
  const status = STATUS_META[ticket.bookingStatus ?? ''] ?? STATUS_META.CONFIRMED;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <TicketIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Ticket #{ticket.ticketId}</DialogTitle>
              <DialogDescription>Issued {formatDateTime(ticket.issuedAt)}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex items-center justify-between py-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${status.classes}`}>
            {status.icon}
            {status.label}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border bg-muted text-foreground/80 border-border">
            {ticket.issueMethod === 'ONLINE' ? <CreditCard className="w-4 h-4" /> : <Banknote className="w-4 h-4" />}
            {ticket.issueMethod === 'ONLINE' ? 'Online Booking' : 'Cash (Conductor)'}
          </span>
        </div>

        <div className="rounded-xl border border-border bg-card px-4">
          <Row label="Passenger" value={ticket.passengerId || 'Walk-in'} />
          <Row label="Seat Number" value={ticket.seatNumber || '—'} />
          <Row label="Fare Amount" value={`Rs. ${(ticket.fareAmount ?? 0).toLocaleString()}`} />
          <Row label="Bus" value={<span className="font-mono text-xs">{ticket.busId}</span>} />
          <Row label="Trip" value={<span className="font-mono text-xs">{ticket.tripId}</span>} />
          {ticket.conductorId && <Row label="Conductor" value={<span className="font-mono text-xs">{ticket.conductorId}</span>} />}
          <Row label="From Stop" value={<span className="font-mono text-xs">{ticket.startLocationId || '—'}</span>} />
          <Row label="To Stop" value={<span className="font-mono text-xs">{ticket.endLocationId || '—'}</span>} />
          <Row label="Transaction Status" value={ticket.transactionStatus || '—'} />
          <Row label="Boarding Status" value={ticket.validationStatus || '—'} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
