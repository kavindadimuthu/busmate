'use client';

import { StatsCardsContainer } from '@/components/shared/StatsCardsContainer';
import { AnalyticsTrendsChart } from './AnalyticsTrendsChart';
import { AnalyticsPieChart } from './charts/AnalyticsPieChart';
import {
  Bus,
  Users,
  Route,
  DollarSign,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import type { AnalyticsKPIMetric, TrendPoint, DistributionItem } from '@/data/mot/analytics';
import type { StatsCardMetric, StatsCardColor } from '@/components/shared/StatsCard';

// ── Types ────────────────────────────────────────────────────────

interface AnalyticsOverviewProps {
  kpis: AnalyticsKPIMetric[];
  trendHistory: TrendPoint[];
  tripStatusDistribution: DistributionItem[];
  routeTypeDistribution: DistributionItem[];
  loading?: boolean;
}

// ── Icon mapping ─────────────────────────────────────────────────

const ICONS: Record<string, LucideIcon> = {
  'kpi-trips': Route,
  'kpi-passengers': Users,
  'kpi-revenue': DollarSign,
  'kpi-ontime': Clock,
  'kpi-active-buses': Bus,
};

// ── Component ────────────────────────────────────────────────────

export function AnalyticsOverview({
  kpis,
  trendHistory,
  tripStatusDistribution,
  routeTypeDistribution,
  loading = false,
}: AnalyticsOverviewProps) {
  // Map KPIs to StatsCard format
  const statsMetrics: StatsCardMetric[] = kpis.map((kpi) => ({
    label: kpi.label,
    value: kpi.value,
    trend: kpi.trend,
    trendValue: kpi.trendValue,
    trendPositiveIsGood: kpi.trendPositiveIsGood,
    color: kpi.color as StatsCardColor,
    sparkData: kpi.sparkData,
    icon: ICONS[kpi.id],
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <StatsCardsContainer
        metrics={statsMetrics}
        loading={loading}
        columns={5}
      />

      {/* Trends Chart */}
      <AnalyticsTrendsChart
        data={trendHistory}
        loading={loading}
      />

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsPieChart
          data={tripStatusDistribution}
          title="Trip Status Distribution"
          subtitle="Current breakdown of trip statuses"
          type="doughnut"
          loading={loading}
          centerValue={tripStatusDistribution.reduce((sum, d) => sum + d.value, 0).toLocaleString()}
          centerLabel="Total Trips"
        />

        <AnalyticsPieChart
          data={routeTypeDistribution}
          title="Route Type Distribution"
          subtitle="Routes categorized by type"
          type="doughnut"
          loading={loading}
          centerValue={routeTypeDistribution.reduce((sum, d) => sum + d.value, 0).toLocaleString()}
          centerLabel="Total Routes"
        />
      </div>
    </div>
  );
}
