'use client';

import { Bus, CheckCircle, XCircle, Wrench, Gauge, Users } from 'lucide-react';
import { StatsCardsContainer } from '@/components/shared/StatsCardsContainer';
import type { StatsCardMetric } from '@/components/shared/StatsCard';
import type { FleetStatistics } from '@/data/operator/buses';

// ── Types ─────────────────────────────────────────────────────────

interface FleetStatsCardsProps {
  stats: FleetStatistics;
  loading?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────

/** Generate a simple ascending sparkline from ~70 % to 100 % of value. */
function toSparkData(val: number): number[] {
  if (val === 0) return [0, 0, 0, 0];
  return [
    Math.floor(val * 0.70),
    Math.floor(val * 0.80),
    Math.floor(val * 0.90),
    val,
  ];
}

// ── Component ─────────────────────────────────────────────────────

export function FleetStatsCards({ stats, loading = false }: FleetStatsCardsProps) {
  const metrics: StatsCardMetric[] = [
    {
      label:               'Total Buses',
      value:               stats.totalBuses.toLocaleString(),
      trend:               'stable',
      trendValue:          '',
      trendPositiveIsGood: true,
      color:               'blue',
      sparkData:           toSparkData(stats.totalBuses),
      icon:                Bus,
    },
    {
      label:               'Active',
      value:               stats.activeBuses.toLocaleString(),
      trend:               'stable',
      trendValue:          '',
      trendPositiveIsGood: true,
      color:               'green',
      sparkData:           toSparkData(stats.activeBuses),
      icon:                CheckCircle,
    },
    {
      label:               'Inactive',
      value:               stats.inactiveBuses.toLocaleString(),
      trend:               'stable',
      trendValue:          '',
      trendPositiveIsGood: false,
      color:               'red',
      sparkData:           toSparkData(stats.inactiveBuses),
      icon:                XCircle,
    },
    {
      label:               'Maintenance',
      value:               stats.maintenanceBuses.toLocaleString(),
      trend:               'stable',
      trendValue:          '',
      trendPositiveIsGood: false,
      color:               'amber',
      sparkData:           toSparkData(stats.maintenanceBuses),
      icon:                Wrench,
    },
    {
      label:               'Avg. Capacity',
      value:               `${Math.round(stats.averageCapacity)} seats`,
      trend:               'stable',
      trendValue:          '',
      trendPositiveIsGood: true,
      color:               'purple',
      sparkData:           toSparkData(Math.round(stats.averageCapacity)),
      icon:                Gauge,
    },
    {
      label:               'Total Seats',
      value:               stats.totalCapacity.toLocaleString(),
      trend:               'stable',
      trendValue:          '',
      trendPositiveIsGood: true,
      color:               'teal',
      sparkData:           toSparkData(stats.totalCapacity),
      icon:                Users,
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
