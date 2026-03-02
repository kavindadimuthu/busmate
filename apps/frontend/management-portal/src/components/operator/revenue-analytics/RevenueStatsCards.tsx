'use client';

import React from 'react';
import {
  DollarSign,
  Ticket,
  TrendingUp,
  CreditCard,
  Bus,
  BarChart3,
} from 'lucide-react';
import { StatsCardsContainer } from '@/components/shared/StatsCardsContainer';
import type { StatsCardMetric } from '@/components/shared/StatsCard';
import type { RevenueKPISummary } from '@/data/operator/revenue';

// ── Props ─────────────────────────────────────────────────────────

interface RevenueStatsCardsProps {
  /** Revenue KPI data to display. */
  kpis: RevenueKPISummary | null;
  /** Show skeleton loading state. */
  loading: boolean;
}

// ── Component ─────────────────────────────────────────────────────

/**
 * Revenue KPI stats cards row.
 *
 * Displays total revenue, tickets sold, average price, net revenue,
 * total trips, and refunds as stat cards in a responsive grid.
 */
export function RevenueStatsCards({ kpis, loading }: RevenueStatsCardsProps) {
  const metrics: StatsCardMetric[] = kpis
    ? [
        {
          label: 'Total Revenue',
          value: `Rs ${kpis.totalRevenue.toLocaleString()}`,
          trend: kpis.revenueChange >= 0 ? 'up' : 'down',
          trendValue: `${kpis.revenueChange >= 0 ? '+' : ''}${kpis.revenueChange}%`,
          trendPositiveIsGood: true,
          color: 'blue',
          sparkData: [65, 72, 68, 80, 85, 78, 90, 95],
          icon: DollarSign,
        },
        {
          label: 'Tickets Sold',
          value: kpis.totalTickets.toLocaleString(),
          trend: kpis.ticketsChange >= 0 ? 'up' : 'down',
          trendValue: `${kpis.ticketsChange >= 0 ? '+' : ''}${kpis.ticketsChange}%`,
          trendPositiveIsGood: true,
          color: 'teal',
          sparkData: [120, 135, 128, 145, 150, 142, 160, 168],
          icon: Ticket,
        },
        {
          label: 'Avg Ticket Price',
          value: `Rs ${kpis.avgTicketPrice.toLocaleString()}`,
          trend: 'stable',
          trendValue: 'Stable',
          trendPositiveIsGood: true,
          color: 'purple',
          sparkData: [110, 115, 112, 118, 116, 120, 119, 122],
          icon: TrendingUp,
        },
        {
          label: 'Net Revenue',
          value: `Rs ${kpis.netRevenue.toLocaleString()}`,
          trend: 'up',
          trendValue: 'After refunds',
          trendPositiveIsGood: true,
          color: 'green',
          sparkData: [60, 68, 64, 75, 80, 73, 85, 88],
          icon: CreditCard,
        },
        {
          label: 'Total Trips',
          value: kpis.totalTrips.toLocaleString(),
          trend: 'up',
          trendValue: '+5.2%',
          trendPositiveIsGood: true,
          color: 'amber',
          sparkData: [30, 35, 32, 38, 40, 37, 42, 45],
          icon: Bus,
        },
        {
          label: 'Refunds',
          value: `Rs ${kpis.totalRefunds.toLocaleString()}`,
          trend: kpis.totalRefunds > 0 ? 'down' : 'stable',
          trendValue: kpis.totalRefunds > 0 ? '-2.1%' : 'None',
          trendPositiveIsGood: false,
          color: 'red',
          sparkData: [8, 5, 7, 4, 6, 3, 5, 4],
          icon: BarChart3,
        },
      ]
    : [];

  return (
    <StatsCardsContainer
      metrics={metrics}
      loading={loading}
      columns={6}
      skeletonCount={6}
    />
  );
}
