'use client';

import { StatsCardsContainer } from '@/components/shared/StatsCardsContainer';
import { AnalyticsBarChart } from './charts/AnalyticsBarChart';
import { AnalyticsPieChart } from './charts/AnalyticsPieChart';
import { AnalyticsLineChart } from './charts/AnalyticsLineChart';
import { AnalyticsDataTable, ProgressBar } from './charts/AnalyticsDataTable';
import { Users, UserPlus, Clock, TrendingUp } from 'lucide-react';
import type { PassengerAnalyticsData } from '@/data/mot/analytics';
import type { StatsCardMetric } from '@/components/shared/StatsCard';

// ── Types ────────────────────────────────────────────────────────

interface PassengerAnalyticsPanelProps {
  data: PassengerAnalyticsData;
  loading?: boolean;
}

// ── Component ────────────────────────────────────────────────────

export function PassengerAnalyticsPanel({ data, loading = false }: PassengerAnalyticsPanelProps) {
  // KPI metrics
  const kpiMetrics: StatsCardMetric[] = [
    {
      label: 'Total Passengers',
      value: data.totalPassengers.toLocaleString(),
      trend: 'up',
      trendValue: `+${data.weeklyGrowth}% this week`,
      trendPositiveIsGood: true,
      color: 'blue',
      sparkData: [430000, 438000, 445000, 450000, 455000, 458231],
      icon: Users,
    },
    {
      label: 'Daily Average',
      value: data.dailyAverage.toLocaleString(),
      trend: 'up',
      trendValue: '+4.8% vs last week',
      trendPositiveIsGood: true,
      color: 'green',
      sparkData: [14200, 14500, 14800, 15000, 15150, 15274],
      icon: UserPlus,
    },
    {
      label: 'Peak Hour Volume',
      value: data.peakHourPassengers.toLocaleString(),
      trend: 'up',
      trendValue: '8:00 AM - 9:00 AM',
      trendPositiveIsGood: true,
      color: 'purple',
      sparkData: [2600, 2700, 2750, 2800, 2830, 2847],
      icon: Clock,
    },
    {
      label: 'Weekly Growth',
      value: `${data.weeklyGrowth}%`,
      trend: 'up',
      trendValue: '+0.8% vs last week',
      trendPositiveIsGood: true,
      color: 'teal',
      sparkData: [3.8, 4.2, 4.5, 4.8, 5.0, 5.2],
      icon: TrendingUp,
    },
  ];

  // Top routes columns
  const topRoutesColumns = [
    { key: 'routeName', label: 'Route' },
    {
      key: 'passengers',
      label: 'Passengers',
      align: 'right' as const,
      render: (v: number) => v.toLocaleString(),
    },
    {
      key: 'percentage',
      label: 'Share',
      align: 'center' as const,
      width: '140px',
      render: (v: number) => <ProgressBar value={v} max={15} color="#3b82f6" />,
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

      {/* Passenger Trend */}
      <AnalyticsLineChart
        data={data.passengerTrend}
        datasets={[
          { key: 'passengers', label: 'Passengers', color: '#3b82f6' },
        ]}
        title="Passenger Volume Trend"
        subtitle="Last 30 days"
        loading={loading}
      />

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsPieChart
          data={data.passengerDemographics}
          title="Passenger Demographics"
          subtitle="Age group distribution"
          type="doughnut"
          loading={loading}
          centerValue={data.totalPassengers.toLocaleString()}
          centerLabel="Total"
        />

        <AnalyticsPieChart
          data={data.passengersByTicketType}
          title="Passengers by Ticket Type"
          subtitle="Ticket category distribution"
          type="doughnut"
          loading={loading}
          centerValue={data.totalPassengers.toLocaleString()}
          centerLabel="Total"
        />
      </div>

      {/* Peak Hours Chart */}
      <AnalyticsBarChart
        data={data.passengersByTimeSlot}
        title="Passengers by Time Slot"
        subtitle="Hourly distribution (05:00 - 22:00)"
        color="#3b82f6"
        loading={loading}
        height={280}
      />

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsDataTable
          title="Top Routes by Passengers"
          subtitle="Highest passenger volume"
          columns={topRoutesColumns}
          data={data.topRoutesByPassengers}
          loading={loading}
          showIndex
        />

        <AnalyticsBarChart
          data={data.passengersByRoute}
          title="Passengers by Top Routes"
          subtitle="Route passenger distribution"
          horizontal
          color="#14b8a6"
          loading={loading}
        />
      </div>
    </div>
  );
}
