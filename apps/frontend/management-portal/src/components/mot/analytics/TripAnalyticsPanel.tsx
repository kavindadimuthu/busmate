'use client';

import { StatsCardsContainer } from '@/components/shared/StatsCardsContainer';
import { AnalyticsBarChart } from './charts/AnalyticsBarChart';
import { AnalyticsPieChart } from './charts/AnalyticsPieChart';
import { AnalyticsLineChart } from './charts/AnalyticsLineChart';
import { Route, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import type { TripAnalyticsData } from '@/data/mot/analytics';
import type { StatsCardMetric } from '@/components/shared/StatsCard';

// ── Types ────────────────────────────────────────────────────────

interface TripAnalyticsPanelProps {
  data: TripAnalyticsData;
  loading?: boolean;
}

// ── Component ────────────────────────────────────────────────────

export function TripAnalyticsPanel({ data, loading = false }: TripAnalyticsPanelProps) {
  // KPI metrics
  const kpiMetrics: StatsCardMetric[] = [
    {
      label: 'Total Trips',
      value: data.totalTrips.toLocaleString(),
      trend: 'up',
      trendValue: '+342 this week',
      trendPositiveIsGood: true,
      color: 'blue',
      sparkData: [12200, 12350, 12500, 12600, 12750, 12847],
      icon: Route,
    },
    {
      label: 'Completed Trips',
      value: data.completedTrips.toLocaleString(),
      trend: 'up',
      trendValue: '+5.2% completion rate',
      trendPositiveIsGood: true,
      color: 'green',
      sparkData: [10800, 10950, 11050, 11150, 11200, 11234],
      icon: CheckCircle,
    },
    {
      label: 'On-Time Rate',
      value: `${data.onTimePercentage}%`,
      trend: 'up',
      trendValue: '+2.1% vs last week',
      trendPositiveIsGood: true,
      color: 'purple',
      sparkData: [84, 85, 85.5, 86, 86.8, 87.3],
      icon: Clock,
    },
    {
      label: 'Avg. Delay',
      value: `${data.averageDelay} min`,
      trend: 'down',
      trendValue: '-0.8 min improvement',
      trendPositiveIsGood: false,
      color: 'amber',
      sparkData: [5.5, 5.2, 5.0, 4.8, 4.5, 4.2],
      icon: AlertTriangle,
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
          data={data.statusDistribution}
          title="Trip Status Distribution"
          subtitle="Current breakdown by status"
          type="doughnut"
          loading={loading}
          centerValue={data.totalTrips.toLocaleString()}
          centerLabel="Total"
        />

        <AnalyticsBarChart
          data={data.tripsByDay}
          title="Trips by Day"
          subtitle="Last 7 days"
          color="#3b82f6"
          loading={loading}
        />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsLineChart
          data={data.tripsTrend}
          datasets={[
            { key: 'completed', label: 'Completed', color: '#22c55e' },
            { key: 'cancelled', label: 'Cancelled', color: '#ef4444' },
            { key: 'delayed', label: 'Delayed', color: '#f59e0b' },
          ]}
          title="Trip Status Trend"
          subtitle="Last 7 days"
          loading={loading}
          showCompareToggle
        />

        <AnalyticsBarChart
          data={data.tripsByRoute.slice(0, 8)}
          title="Top Routes by Trips"
          subtitle="Most active routes"
          horizontal
          color="#14b8a6"
          loading={loading}
        />
      </div>

      {/* Peak Hours */}
      <AnalyticsBarChart
        data={data.peakHours.map(item => ({ label: item.hour, value: item.trips }))}
        title="Trips by Hour"
        subtitle="Daily distribution (05:00 - 22:00)"
        color="#a855f7"
        loading={loading}
        height={250}
      />
    </div>
  );
}
