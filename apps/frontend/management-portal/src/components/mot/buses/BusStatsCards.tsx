'use client';

import React from 'react';
import { Bus, CheckCircle, XCircle, Users, Gauge, MapPin } from 'lucide-react';
import { StatsCardsContainer } from '@/components/shared/StatsCardsContainer';
import { StatsCardMetric, TrendDirection } from '@/components/shared/StatsCard';

interface BusStatsCardsProps {
  stats: {
    totalBuses: { count: number; change?: string };
    activeBuses: { count: number; change?: string };
    inactiveBuses: { count: number; change?: string };
    totalOperators: { count: number; change?: string };
    averageCapacity: { count: number; change?: string };
    totalCapacity: { count: number; change?: string };
  };
}

// ── Helpers ───────────────────────────────────────────────────────

function parseTrend(change?: string): { trend: TrendDirection; trendValue: string } {
  if (!change) return { trend: 'stable', trendValue: '' };
  if (change.startsWith('+')) return { trend: 'up', trendValue: change };
  if (change.startsWith('-')) return { trend: 'down', trendValue: change };
  return { trend: 'stable', trendValue: change };
}

export function BusStatsCards({ stats }: BusStatsCardsProps) {
  const metrics: StatsCardMetric[] = [
    {
      label: 'Total Buses',
      value: stats.totalBuses.count.toLocaleString(),
      trend: parseTrend(stats.totalBuses.change),
      trendValue: stats.totalBuses.change || '',
      color: 'blue',
      icon: Bus,
    },
    {
      label: 'Active',
      value: stats.activeBuses.count.toLocaleString(),
      trend: parseTrend(stats.activeBuses.change),
      trendValue: stats.activeBuses.change || '',
      trendPositiveIsGood: true,
      color: 'green',
      icon: CheckCircle,
    },
    {
      label: 'Inactive',
      value: stats.inactiveBuses.count.toLocaleString(),
      trend: parseTrend(stats.inactiveBuses.change),
      trendValue: stats.inactiveBuses.change || '',
      trendPositiveIsGood: false,
      color: 'amber',
      icon: XCircle,
    },
    {
      label: 'Operators',
      value: stats.totalOperators.count.toLocaleString(),
      trend: parseTrend(stats.totalOperators.change),
      trendValue: stats.totalOperators.change || '',
      color: 'purple',
      icon: Users,
    },
    {
      label: 'Avg Capacity',
      value: Math.round(stats.averageCapacity.count).toString(),
      trend: parseTrend(stats.averageCapacity.change),
      trendValue: stats.averageCapacity.change || '',
      color: 'teal',
      icon: Gauge,
    },
    {
      label: 'Total Capacity',
      value: stats.totalCapacity.count.toLocaleString(),
      trend: parseTrend(stats.totalCapacity.change),
      trendValue: stats.totalCapacity.change || '',
      color: 'blue',
      icon: MapPin,
    },
  ];

  return <StatsCardsContainer metrics={metrics} columns={6} />;
}
