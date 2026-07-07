'use client';

import { StatsCard, StatsCardGrid } from '@busmate/ui';
import { AnalyticsBarChart } from './charts/AnalyticsBarChart';
import { AnalyticsPieChart } from './charts/AnalyticsPieChart';
import { AnalyticsLineChart } from './charts/AnalyticsLineChart';
import { AnalyticsDataTable, ProgressBar } from './charts/AnalyticsDataTable';
import { Users, UserPlus, Clock, TrendingUp } from 'lucide-react';
import type { PassengerAnalyticsData } from '@/data/mot/analytics';

// ── Types ────────────────────────────────────────────────────────

interface PassengerAnalyticsPanelProps {
  data: PassengerAnalyticsData;
  loading?: boolean;
}

// ── Component ────────────────────────────────────────────────────

export function PassengerAnalyticsPanel({ data, loading = false }: PassengerAnalyticsPanelProps) {
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
      <StatsCardGrid className="lg:grid-cols-4">
        <StatsCard
          title="Total Passengers"
          value={data.totalPassengers.toLocaleString()}
          icon={<Users className="h-5 w-5" />}
          description={`+${data.weeklyGrowth}% this week`}
          trend={{ value: data.weeklyGrowth, direction: 'up' }}
        />
        <StatsCard
          title="Daily Average"
          value={data.dailyAverage.toLocaleString()}
          icon={<UserPlus className="h-5 w-5" />}
          description="+4.8% vs last week"
          trend={{ value: 4.8, direction: 'up' }}
        />
        <StatsCard
          title="Peak Hour Volume"
          value={data.peakHourPassengers.toLocaleString()}
          icon={<Clock className="h-5 w-5" />}
          description="8:00 AM - 9:00 AM"
        />
        <StatsCard
          title="Weekly Growth"
          value={`${data.weeklyGrowth}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          description="+0.8% vs last week"
          trend={{ value: 0.8, direction: 'up' }}
        />
      </StatsCardGrid>

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
