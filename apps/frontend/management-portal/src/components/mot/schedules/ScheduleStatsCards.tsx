'use client';

import React from 'react';
import { Calendar, CheckCircle, XCircle, Clock, Zap, Route } from 'lucide-react';
import { StatsCardsContainer } from '@/components/shared/StatsCardsContainer';
import type { StatsCardMetric, TrendDirection } from '@/components/shared/StatsCard';

// ── Types ─────────────────────────────────────────────────────────

interface ScheduleStatsCardsProps {
  stats: {
    totalSchedules: { count: number; change?: string };
    activeSchedules: { count: number; change?: string };
    inactiveSchedules: { count: number; change?: string };
    regularSchedules: { count: number; change?: string };
    specialSchedules: { count: number; change?: string };
    totalRoutes: { count: number; change?: string };
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

/**
 * Schedule-specific stats cards.
 *
 * Wraps the generic `<StatsCardsContainer>` with schedule KPI
 * definitions (total, active, inactive, regular, special, routes covered).
 */
export function ScheduleStatsCards({ stats, loading = false }: ScheduleStatsCardsProps) {
  const metrics: StatsCardMetric[] = [
    {
      label: 'Total Schedules',
      value: stats.totalSchedules.count.toLocaleString(),
      ...parseTrend(stats.totalSchedules.change),
      trendPositiveIsGood: true,
      color: 'blue',
      sparkData: [],
      icon: Calendar,
    },
    {
      label: 'Active',
      value: stats.activeSchedules.count.toLocaleString(),
      ...parseTrend(stats.activeSchedules.change),
      trendPositiveIsGood: true,
      color: 'green',
      sparkData: [],
      icon: CheckCircle,
    },
    {
      label: 'Inactive',
      value: stats.inactiveSchedules.count.toLocaleString(),
      ...parseTrend(stats.inactiveSchedules.change),
      trendPositiveIsGood: false,
      color: 'red',
      sparkData: [],
      icon: XCircle,
    },
    {
      label: 'Regular',
      value: stats.regularSchedules.count.toLocaleString(),
      ...parseTrend(stats.regularSchedules.change),
      trendPositiveIsGood: true,
      color: 'teal',
      sparkData: [],
      icon: Clock,
    },
    {
      label: 'Special',
      value: stats.specialSchedules.count.toLocaleString(),
      ...parseTrend(stats.specialSchedules.change),
      trendPositiveIsGood: true,
      color: 'purple',
      sparkData: [],
      icon: Zap,
    },
    {
      label: 'Routes Covered',
      value: stats.totalRoutes.count.toLocaleString(),
      ...parseTrend(stats.totalRoutes.change),
      trendPositiveIsGood: true,
      color: 'amber',
      sparkData: [],
      icon: Route,
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
