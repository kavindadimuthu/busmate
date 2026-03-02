'use client';

import {
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Navigation,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { StatsCardsContainer } from '@/components/shared/StatsCardsContainer';
import type { StatsCardMetric } from '@/components/shared/StatsCard';
import type { OperatorTripStatistics } from '@/data/operator/trips';

// ── Types ─────────────────────────────────────────────────────────

interface OperatorTripStatsCardsProps {
  stats: OperatorTripStatistics | null;
  loading?: boolean;
}

// ── Component ─────────────────────────────────────────────────────

/**
 * KPI stats cards for the operator trips listing page.
 *
 * Uses the shared `<StatsCardsContainer>` to maintain visual consistency
 * with other listing pages across the portal.
 */
export function OperatorTripStatsCards({ stats, loading = false }: OperatorTripStatsCardsProps) {
  const safeStats: OperatorTripStatistics = stats ?? {
    totalTrips: 0,
    activeTrips: 0,
    pendingTrips: 0,
    completedTrips: 0,
    cancelledTrips: 0,
    delayedTrips: 0,
    inTransitTrips: 0,
    todaysTrips: 0,
  };

  const metrics: StatsCardMetric[] = [
    // {
    //   label: "Today's Trips",
    //   value: safeStats.todaysTrips.toLocaleString(),
    //   trend: 'stable',
    //   trendValue: '',
    //   trendPositiveIsGood: true,
    //   color: 'blue',
    //   sparkData: [],
    //   icon: Zap,
    // },
    {
      label: 'In Transit',
      value: safeStats.inTransitTrips.toLocaleString(),
      trend: 'stable',
      trendValue: '',
      trendPositiveIsGood: true,
      color: 'purple',
      sparkData: [],
      icon: Navigation,
    },
    {
      label: 'Active',
      value: safeStats.activeTrips.toLocaleString(),
      trend: 'stable',
      trendValue: '',
      trendPositiveIsGood: true,
      color: 'green',
      sparkData: [],
      icon: CheckCircle,
    },
    // {
    //   label: 'Pending',
    //   value: safeStats.pendingTrips.toLocaleString(),
    //   trend: 'stable',
    //   trendValue: '',
    //   trendPositiveIsGood: false,
    //   color: 'amber',
    //   sparkData: [],
    //   icon: Clock,
    // },
    {
      label: 'Delayed',
      value: safeStats.delayedTrips.toLocaleString(),
      trend: 'stable',
      trendValue: '',
      trendPositiveIsGood: false,
      color: 'amber',
      sparkData: [],
      icon: AlertTriangle,
    },
    {
      label: 'Completed',
      value: safeStats.completedTrips.toLocaleString(),
      trend: 'stable',
      trendValue: '',
      trendPositiveIsGood: true,
      color: 'teal',
      sparkData: [],
      icon: CheckCircle,
    },
    {
      label: 'Cancelled',
      value: safeStats.cancelledTrips.toLocaleString(),
      trend: 'stable',
      trendValue: '',
      trendPositiveIsGood: false,
      color: 'red',
      sparkData: [],
      icon: XCircle,
    },
    {
      label: 'Total Trips',
      value: safeStats.totalTrips.toLocaleString(),
      trend: 'stable',
      trendValue: '',
      trendPositiveIsGood: true,
      color: 'blue',
      sparkData: [],
      icon: Calendar,
    },
  ];

  return (
    <StatsCardsContainer
      metrics={metrics}
      loading={loading}
      columns={6}
      skeletonCount={6}
    />
  );
}
