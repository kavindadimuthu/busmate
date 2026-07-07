'use client';

import { StatsCard, StatsCardGrid } from '@busmate/ui';
import { AnalyticsBarChart } from './charts/AnalyticsBarChart';
import { AnalyticsPieChart } from './charts/AnalyticsPieChart';
import { AnalyticsDataTable, ProgressBar } from './charts/AnalyticsDataTable';
import { Route, MapPin, Users, TrendingUp } from 'lucide-react';
import type { RouteAnalyticsData } from '@/data/mot/analytics';

// ── Types ────────────────────────────────────────────────────────

interface RouteAnalyticsPanelProps {
  data: RouteAnalyticsData;
  loading?: boolean;
}

// ── Component ────────────────────────────────────────────────────

export function RouteAnalyticsPanel({ data, loading = false }: RouteAnalyticsPanelProps) {
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
      <StatsCardGrid className="lg:grid-cols-4">
        <StatsCard
          title="Total Routes"
          value={data.totalRoutes.toLocaleString()}
          icon={<Route className="h-5 w-5" />}
          description="No change this month"
          trend={{ value: 0, direction: 'neutral' }}
        />
        <StatsCard
          title="Active Routes"
          value={data.activeRoutes.toLocaleString()}
          icon={<MapPin className="h-5 w-5" />}
          description="+3 activated this week"
          trend={{ value: 3, direction: 'up' }}
        />
        <StatsCard
          title="Avg. Passengers/Route"
          value={data.averagePassengersPerRoute.toLocaleString()}
          icon={<Users className="h-5 w-5" />}
          description="+4.2% vs last month"
          trend={{ value: 4.2, direction: 'up' }}
        />
        <StatsCard
          title="Highest Demand"
          value={data.highestDemandRoute.passengers.toLocaleString()}
          icon={<TrendingUp className="h-5 w-5" />}
          description={data.highestDemandRoute.name}
          trend={{ value: 0, direction: 'up' }}
        />
      </StatsCardGrid>

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
