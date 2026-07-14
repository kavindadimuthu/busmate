import * as React from 'react';
import { Ticket, CheckCircle, Clock, XCircle } from 'lucide-react';
import { StatsCard, StatsCardGrid } from '@busmate/ui';

export interface TicketStatistics {
  totalTickets: number;
  boardedTickets: number;
  confirmedTickets: number;
  pendingPaymentTickets: number;
  cancelledTickets: number;
  totalRevenue: number;
}

interface TicketStatsCardsProps {
  stats: TicketStatistics;
  loading?: boolean;
}

/** Shared between operator and MOT ticket listing pages - computed client-side from the current page's data (no dedicated stats endpoint on ticketing-service). */
export function TicketStatsCards({ stats, loading = false }: TicketStatsCardsProps) {
  if (loading) {
    return (
      <StatsCardGrid className="lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border bg-card animate-pulse" />
        ))}
      </StatsCardGrid>
    );
  }

  return (
    <StatsCardGrid className="lg:grid-cols-5">
      <StatsCard title="Total Tickets" value={stats.totalTickets.toLocaleString()} icon={<Ticket className="h-5 w-5" />} />
      <StatsCard title="Boarded" value={stats.boardedTickets.toLocaleString()} icon={<CheckCircle className="h-5 w-5" />} />
      <StatsCard title="Confirmed" value={stats.confirmedTickets.toLocaleString()} icon={<CheckCircle className="h-5 w-5" />} />
      <StatsCard title="Pending Payment" value={stats.pendingPaymentTickets.toLocaleString()} icon={<Clock className="h-5 w-5" />} />
      <StatsCard title="Cancelled" value={stats.cancelledTickets.toLocaleString()} icon={<XCircle className="h-5 w-5" />} />
    </StatsCardGrid>
  );
}
