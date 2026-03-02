'use client';

import React from 'react';
import {
  Building,
  CheckCircle,
  XCircle,
  MapPin,
  Users,
} from 'lucide-react';
import { StatsCardsContainer } from '@/components/shared/StatsCardsContainer';
import type { StatsCardMetric, TrendDirection } from '@/components/shared/StatsCard';

// ── Types ─────────────────────────────────────────────────────────

interface OperatorStatsCardsProps {
  stats: {
    totalOperators: { count: number; change?: string };
    activeOperators: { count: number; change?: string };
    inactiveOperators: { count: number; change?: string };
    privateOperators: { count: number; change?: string };
    ctbOperators: { count: number; change?: string };
    totalRegions: { count: number; change?: string };
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

export function OperatorStatsCards({ stats, loading = false }: OperatorStatsCardsProps) {
  const metrics: StatsCardMetric[] = [
    {
      label: 'Total Operators',
      value: stats.totalOperators.count.toLocaleString(),
      ...parseTrend(stats.totalOperators.change),
      trendPositiveIsGood: true,
      color: 'blue',
      sparkData: [],
      icon: Building,
    },
    {
      label: 'Active',
      value: stats.activeOperators.count.toLocaleString(),
      ...parseTrend(stats.activeOperators.change),
      trendPositiveIsGood: true,
      color: 'green',
      sparkData: [],
      icon: CheckCircle,
    },
    {
      label: 'Inactive',
      value: stats.inactiveOperators.count.toLocaleString(),
      ...parseTrend(stats.inactiveOperators.change),
      trendPositiveIsGood: false,
      color: 'red',
      sparkData: [],
      icon: XCircle,
    },
    {
      label: 'Private',
      value: stats.privateOperators.count.toLocaleString(),
      ...parseTrend(stats.privateOperators.change),
      trendPositiveIsGood: true,
      color: 'purple',
      sparkData: [],
      icon: Building,
    },
    {
      label: 'CTB',
      value: stats.ctbOperators.count.toLocaleString(),
      ...parseTrend(stats.ctbOperators.change),
      trendPositiveIsGood: true,
      color: 'teal',
      sparkData: [],
      icon: Users,
    },
    {
      label: 'Regions Covered',
      value: stats.totalRegions.count.toLocaleString(),
      ...parseTrend(stats.totalRegions.change),
      trendPositiveIsGood: true,
      color: 'amber',
      sparkData: [],
      icon: MapPin,
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
