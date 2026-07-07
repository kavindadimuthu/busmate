'use client';

import { StatsCard, StatsCardGrid } from '@busmate/ui';
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
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <StatsCardGrid className="lg:grid-cols-5">
        {kpis.map((kpi) => {
          const Icon = ICONS[kpi.id];
          return (
            <StatsCard
              key={kpi.id}
              title={kpi.label}
              value={kpi.value}
              icon={Icon ? <Icon className="h-5 w-5" /> : undefined}
              description={kpi.trendValue}
              trend={{
                value: parseFloat(kpi.trendValue) || 0,
                direction: kpi.trend === 'up' ? 'up' : kpi.trend === 'down' ? 'down' : 'neutral',
              }}
            />
          );
        })}
      </StatsCardGrid>

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
