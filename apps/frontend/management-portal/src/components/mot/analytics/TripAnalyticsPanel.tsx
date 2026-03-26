'use client';

import { StatsCard, StatsCardGrid } from '@busmate/ui';
import { AnalyticsBarChart } from './charts/AnalyticsBarChart';
import { AnalyticsPieChart } from './charts/AnalyticsPieChart';
import { AnalyticsLineChart } from './charts/AnalyticsLineChart';
import { Route, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import type { TripAnalyticsData } from '@/data/mot/analytics';

// ── Types ────────────────────────────────────────────────────────

interface TripAnalyticsPanelProps {
  data: TripAnalyticsData;
  loading?: boolean;
}

// ── Component ────────────────────────────────────────────────────

export function TripAnalyticsPanel({ data, loading = false }: TripAnalyticsPanelProps) {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <StatsCardGrid className="lg:grid-cols-4">
        <StatsCard
          title="Total Trips"
          value={data.totalTrips.toLocaleString()}
          icon={<Route className="h-5 w-5" />}
          description="+342 this week"
          trend={{ value: 342, direction: 'up' }}
        />
        <StatsCard
          title="Completed Trips"
          value={data.completedTrips.toLocaleString()}
          icon={<CheckCircle className="h-5 w-5" />}
          description="+5.2% completion rate"
          trend={{ value: 5.2, direction: 'up' }}
        />
        <StatsCard
          title="On-Time Rate"
          value={`${data.onTimePercentage}%`}
          icon={<Clock className="h-5 w-5" />}
          description="+2.1% vs last week"
          trend={{ value: 2.1, direction: 'up' }}
        />
        <StatsCard
          title="Avg. Delay"
          value={`${data.averageDelay} min`}
          icon={<AlertTriangle className="h-5 w-5" />}
          description="-0.8 min improvement"
          trend={{ value: -0.8, direction: 'down' }}
        />
      </StatsCardGrid>

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
