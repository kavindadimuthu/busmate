'use client';

import { StatsCardsContainer } from '@/components/shared/StatsCardsContainer';
import { AnalyticsBarChart } from './charts/AnalyticsBarChart';
import { AnalyticsPieChart } from './charts/AnalyticsPieChart';
import { AnalyticsDataTable, ProgressBar } from './charts/AnalyticsDataTable';
import { Route, MapPin, Users, TrendingUp } from 'lucide-react';
import type { RouteAnalyticsData } from '@/data/mot/analytics';
import type { StatsCardMetric } from '@/components/shared/StatsCard';

// ── Types ────────────────────────────────────────────────────────

interface RouteAnalyticsPanelProps {
  data: RouteAnalyticsData;
  loading?: boolean;
}

// ── Component ────────────────────────────────────────────────────

export function RouteAnalyticsPanel({ data, loading = false }: RouteAnalyticsPanelProps) {
  // KPI metrics
  const kpiMetrics: StatsCardMetric[] = [
    {
      label: 'Total Routes',
      value: data.totalRoutes.toLocaleString(),
      trend: 'stable',
      trendValue: 'No change this month',
      trendPositiveIsGood: true,
      color: 'blue',
      sparkData: [480, 482, 484, 485, 486, 487],
      icon: Route,
    },
    {
      label: 'Active Routes',
      value: data.activeRoutes.toLocaleString(),
      trend: 'up',
      trendValue: '+3 activated this week',
      trendPositiveIsGood: true,
      color: 'green',
      sparkData: [415, 417, 418, 420, 421, 423],
      icon: MapPin,
    },
    {
      label: 'Avg. Passengers/Route',
      value: data.averagePassengersPerRoute.toLocaleString(),
      trend: 'up',
      trendValue: '+4.2% vs last month',
      trendPositiveIsGood: true,
      color: 'teal',
      sparkData: [890, 905, 918, 925, 936, 942],
      icon: Users,
    },
    {
      label: 'Highest Demand',
      value: data.highestDemandRoute.passengers.toLocaleString(),
      trend: 'up',
      trendValue: data.highestDemandRoute.name,
      trendPositiveIsGood: true,
      color: 'purple',
      sparkData: [42000, 43200, 43800, 44500, 44900, 45230],
      icon: TrendingUp,
    },
  ];

  // Route performance table columns
  const performanceColumns = [
    { key: 'routeName', label: 'Route' },
    {
      key: 'trips',
      label: 'Trips',
      align: 'right' as const,
      render: (v: number) => v.toLocaleString(),
    },
    {
      key: 'passengers',
      label: 'Passengers',
      align: 'right' as const,
      render: (v: number) => v.toLocaleString(),
    },
    {
      key: 'revenue',
      label: 'Revenue',
      align: 'right' as const,
      render: (v: number) => `Rs ${(v / 1000000).toFixed(2)}M`,
    },
    {
      key: 'onTimeRate',
      label: 'On-Time Rate',
      align: 'center' as const,
      width: '160px',
      render: (v: number) => <ProgressBar value={v} color={v >= 90 ? '#22c55e' : v >= 80 ? '#f59e0b' : '#ef4444'} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <StatsCardsContainer
        metrics={kpiMetrics}
        loading={loading}
        columns={4}
      />

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsPieChart
          data={data.routesByRegion}
          title="Routes by Region"
          subtitle="Geographic distribution"
          type="doughnut"
          loading={loading}
          centerValue={data.totalRoutes.toLocaleString()}
          centerLabel="Total Routes"
        />

        <AnalyticsPieChart
          data={data.routeTypeDistribution}
          title="Route Types"
          subtitle="Categorized by service type"
          type="doughnut"
          loading={loading}
          centerValue={data.totalRoutes.toLocaleString()}
          centerLabel="Total"
        />
      </div>

      {/* Route Performance Table */}
      <AnalyticsDataTable
        title="Top Performing Routes"
        subtitle="Sorted by passenger volume"
        columns={performanceColumns}
        data={data.routePerformance}
        loading={loading}
        showIndex
      />

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsBarChart
          data={data.passengersByRoute}
          title="Passengers by Top Routes"
          subtitle="Total passengers served"
          horizontal
          color="#3b82f6"
          loading={loading}
        />

        <AnalyticsBarChart
          data={data.routesByRegion.map((r) => ({ label: r.label, value: r.value, color: r.color }))}
          title="Routes per Region"
          subtitle="Regional distribution"
          color="#22c55e"
          loading={loading}
        />
      </div>
    </div>
  );
}
