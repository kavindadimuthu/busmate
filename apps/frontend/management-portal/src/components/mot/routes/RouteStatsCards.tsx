'use client';

import { Route, Navigation, Ruler, Users, Clock } from 'lucide-react';
import { StatsCardsContainer } from '@/components/shared/StatsCardsContainer';
import type { StatsCardMetric } from '@/components/shared/StatsCard';

// ── Types ─────────────────────────────────────────────────────────

interface RouteStatsCardsProps {
  stats: {
    totalRoutes: { count: number; change?: string };
    outboundRoutes: { count: number; change?: string };
    inboundRoutes: { count: number; change?: string };
    averageDistance: { count: number; unit: string };
    totalRouteGroups: { count: number; change?: string };
    averageDuration: { count: number; unit: string };
  };
  loading?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────

function parseTrend(change?: string): { trend: 'up' | 'down' | 'stable'; trendValue: string } {
  if (!change) return { trend: 'stable', trendValue: '' };
  if (change.startsWith('+')) return { trend: 'up', trendValue: change };
  if (change.startsWith('-')) return { trend: 'down', trendValue: change };
  return { trend: 'stable', trendValue: change };
}

// ── Component ─────────────────────────────────────────────────────

/**
 * Route-specific stats cards.
 *
 * Wraps the generic `<StatsCardsContainer>` with route KPI
 * definitions (total routes, outbound, inbound, avg distance, route groups, avg duration).
 */
export function RouteStatsCards({ stats, loading = false }: RouteStatsCardsProps) {
  const metrics: StatsCardMetric[] = [
    {
      label: 'Total Routes',
      value: stats.totalRoutes.count.toLocaleString(),
      ...parseTrend(stats.totalRoutes.change),
      trendPositiveIsGood: true,
      color: 'blue',
      sparkData: [2, 4, 3, 6, 5, 8, 7, Math.max(stats.totalRoutes.count, 1)],
      icon: Route,
    },
    {
      label: 'Outbound',
      value: stats.outboundRoutes.count.toLocaleString(),
      ...parseTrend(stats.outboundRoutes.change),
      trendPositiveIsGood: true,
      color: 'green',
      sparkData: [1, 3, 2, 5, 4, 6, 5, Math.max(stats.outboundRoutes.count, 1)],
      icon: Navigation,
    },
    {
      label: 'Inbound',
      value: stats.inboundRoutes.count.toLocaleString(),
      ...parseTrend(stats.inboundRoutes.change),
      trendPositiveIsGood: true,
      color: 'teal',
      sparkData: [1, 2, 2, 4, 3, 5, 4, Math.max(stats.inboundRoutes.count, 1)],
      icon: Navigation,
    },
    {
      label: 'Avg Distance',
      value: `${stats.averageDistance.count.toFixed(1)} ${stats.averageDistance.unit}`,
      trend: 'stable',
      trendValue: '',
      trendPositiveIsGood: true,
      color: 'amber',
      sparkData: [10, 12, 11, 13, 12, 14, 12, Math.max(stats.averageDistance.count, 1)],
      icon: Ruler,
    },
    {
      label: 'Route Groups',
      value: stats.totalRouteGroups.count.toLocaleString(),
      ...parseTrend(stats.totalRouteGroups.change),
      trendPositiveIsGood: true,
      color: 'purple',
      sparkData: [1, 1, 2, 2, 3, 3, 3, Math.max(stats.totalRouteGroups.count, 1)],
      icon: Users,
    },
    {
      label: 'Avg Duration',
      value: `${stats.averageDuration.count.toFixed(0)} ${stats.averageDuration.unit}`,
      trend: 'stable',
      trendValue: '',
      trendPositiveIsGood: true,
      color: 'teal',
      sparkData: [30, 35, 32, 40, 38, 42, 38, Math.max(stats.averageDuration.count, 1)],
      icon: Clock,
    },
  ];

  return (
    <StatsCardsContainer
      metrics={metrics}
      loading={loading}
      columns={6}
    />
  );
}
