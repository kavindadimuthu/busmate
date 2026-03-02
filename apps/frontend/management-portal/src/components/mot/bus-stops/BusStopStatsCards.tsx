'use client';

import React from 'react';
import { MapPin, Accessibility, AlertCircle, Map, Building2 } from 'lucide-react';
import { StatsCardsContainer } from '@/components/shared/StatsCardsContainer';
import type { StatsCardMetric, TrendDirection } from '@/components/shared/StatsCard';

// ── Types ─────────────────────────────────────────────────────────

interface BusStopStatsCardsProps {
  stats: {
    totalStops: { count: number; change?: string };
    accessibleStops: { count: number; change?: string };
    nonAccessibleStops: { count: number; change?: string };
    totalStates: { count: number; change?: string };
    totalCities: { count: number; change?: string };
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
 * Bus-stop-specific stats cards.
 *
 * Wraps the generic `<StatsCardsContainer>` with bus-stop KPI
 * definitions (total stops, accessible, non-accessible, states, cities).
 */
export function BusStopStatsCards({ stats, loading = false }: BusStopStatsCardsProps) {
  const metrics: StatsCardMetric[] = [
    {
      label: 'Total Bus Stops',
      value: stats.totalStops.count.toLocaleString(),
      ...parseTrend(stats.totalStops.change),
      trendPositiveIsGood: true,
      color: 'blue',
      sparkData: [],
      icon: MapPin,
    },
    {
      label: 'Accessible',
      value: stats.accessibleStops.count.toLocaleString(),
      ...parseTrend(stats.accessibleStops.change),
      trendPositiveIsGood: true,
      color: 'green',
      sparkData: [],
      icon: Accessibility,
    },
    {
      label: 'Non-Accessible',
      value: stats.nonAccessibleStops.count.toLocaleString(),
      ...parseTrend(stats.nonAccessibleStops.change),
      trendPositiveIsGood: false,
      color: 'red',
      sparkData: [],
      icon: AlertCircle,
    },
    {
      label: 'States',
      value: stats.totalStates.count.toLocaleString(),
      ...parseTrend(stats.totalStates.change),
      trendPositiveIsGood: true,
      color: 'purple',
      sparkData: [],
      icon: Map,
    },
    {
      label: 'Cities',
      value: stats.totalCities.count.toLocaleString(),
      ...parseTrend(stats.totalCities.change),
      trendPositiveIsGood: true,
      color: 'teal',
      sparkData: [],
      icon: Building2,
    },
  ];

  return (
    <StatsCardsContainer
      metrics={metrics}
      loading={loading}
      columns={5}
    />
  );
}
