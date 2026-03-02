'use client';

import React from 'react';
import {
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  XCircle,
  Users,
  Bus,
} from 'lucide-react';
import { StatsCardsContainer } from '@/components/shared/StatsCardsContainer';
import type { StatsCardMetric, TrendDirection } from '@/components/shared/StatsCard';

// ── Types ─────────────────────────────────────────────────────────

interface TripStatsCardsProps {
  stats: {
    totalTrips: { count: number; change?: string };
    activeTrips: { count: number; change?: string };
    completedTrips: { count: number; change?: string };
    pendingTrips: { count: number; change?: string };
    cancelledTrips: { count: number; change?: string };
    // tripsWithPsp: { count: number; change?: string };
    // tripsWithBus: { count: number; change?: string };
    inTransitTrips: { count: number; change?: string };
  };
  loading?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────

function parseTrend(change?: string): { trend: TrendDirection; trendValue: string } {
  if (!change) return { trend: 'stable', trendValue: 'No change' };
  if (change.startsWith('+')) return { trend: 'up', trendValue: change };
  if (change.startsWith('-')) return { trend: 'down', trendValue: change };
  return { trend: 'stable', trendValue: change };
}

// ── Component ─────────────────────────────────────────────────────

export function TripStatsCards({ stats, loading = false }: TripStatsCardsProps) {
  const metrics: StatsCardMetric[] = [
    {
      label: 'Total Trips',
      value: stats.totalTrips.count.toLocaleString(),
      ...parseTrend(stats.totalTrips.change),
      trendPositiveIsGood: true,
      color: 'blue',
      sparkData: [],
      icon: Calendar,
    },
    {
      label: 'Active',
      value: stats.activeTrips.count.toLocaleString(),
      ...parseTrend(stats.activeTrips.change),
      trendPositiveIsGood: true,
      color: 'green',
      sparkData: [],
      icon: CheckCircle,
    },
    {
      label: 'Completed',
      value: stats.completedTrips.count.toLocaleString(),
      ...parseTrend(stats.completedTrips.change),
      trendPositiveIsGood: true,
      color: 'teal',
      sparkData: [],
      icon: CheckCircle,
    },
    {
      label: 'Pending',
      value: stats.pendingTrips.count.toLocaleString(),
      ...parseTrend(stats.pendingTrips.change),
      trendPositiveIsGood: false,
      color: 'amber',
      sparkData: [],
      icon: Clock,
    },
    {
      label: 'In Transit',
      value: stats.inTransitTrips.count.toLocaleString(),
      ...parseTrend(stats.inTransitTrips.change),
      trendPositiveIsGood: true,
      color: 'purple',
      sparkData: [],
      icon: MapPin,
    },
    {
      label: 'Cancelled',
      value: stats.cancelledTrips.count.toLocaleString(),
      ...parseTrend(stats.cancelledTrips.change),
      trendPositiveIsGood: false,
      color: 'red',
      sparkData: [],
      icon: XCircle,
    },
    // {
    //   label: 'With PSP',
    //   value: stats.tripsWithPsp.count.toLocaleString(),
    //   ...parseTrend(stats.tripsWithPsp.change),
    //   trendPositiveIsGood: true,
    //   color: 'purple',
    //   sparkData: [],
    //   icon: Users,
    // },
    // {
    //   label: 'With Bus',
    //   value: stats.tripsWithBus.count.toLocaleString(),
    //   ...parseTrend(stats.tripsWithBus.change),
    //   trendPositiveIsGood: true,
    //   color: 'blue',
    //   sparkData: [],
    //   icon: Bus,
    // },
  ];

  return (
    <StatsCardsContainer
      metrics={metrics}
      loading={loading}
      columns={6}
    />
  );
}
