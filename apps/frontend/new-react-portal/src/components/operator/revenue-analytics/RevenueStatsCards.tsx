'use client';

import {
  DollarSign,
  Ticket,
  TrendingUp,
  CreditCard,
  Bus,
  BarChart3,
} from 'lucide-react';
import { StatsCard, StatsCardGrid } from '@busmate/ui';
import type { RevenueKPISummary } from '@/data/operator/revenue';

interface RevenueStatsCardsProps {
  kpis: RevenueKPISummary | null;
  loading: boolean;
}

export function RevenueStatsCards({ kpis, loading }: RevenueStatsCardsProps) {
  if (loading || !kpis) {
    return (
      <StatsCardGrid className="lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border bg-card animate-pulse" />
        ))}
      </StatsCardGrid>
    );
  }

  return (
    <StatsCardGrid className="lg:grid-cols-6">
      <StatsCard
        title="Total Revenue"
        value={`Rs ${kpis.totalRevenue.toLocaleString()}`}
        icon={<DollarSign className="h-5 w-5" />}
        trend={{
          value: Math.abs(kpis.revenueChange),
          direction: kpis.revenueChange >= 0 ? 'up' : 'down',
        }}
      />
      <StatsCard
        title="Tickets Sold"
        value={kpis.totalTickets.toLocaleString()}
        icon={<Ticket className="h-5 w-5" />}
        trend={{
          value: Math.abs(kpis.ticketsChange),
          direction: kpis.ticketsChange >= 0 ? 'up' : 'down',
        }}
      />
      <StatsCard
        title="Avg Ticket Price"
        value={`Rs ${kpis.avgTicketPrice.toLocaleString()}`}
        icon={<TrendingUp className="h-5 w-5" />}
      />
      <StatsCard
        title="Net Revenue"
        value={`Rs ${kpis.netRevenue.toLocaleString()}`}
        icon={<CreditCard className="h-5 w-5" />}
        description="After refunds"
      />
      <StatsCard
        title="Total Trips"
        value={kpis.totalTrips.toLocaleString()}
        icon={<Bus className="h-5 w-5" />}
        trend={{ value: 5.2, direction: 'up' }}
      />
      <StatsCard
        title="Refunds"
        value={`Rs ${kpis.totalRefunds.toLocaleString()}`}
        icon={<BarChart3 className="h-5 w-5" />}
        trend={kpis.totalRefunds > 0 ? { value: 2.1, direction: 'down' } : undefined}
      />
    </StatsCardGrid>
  );
}
