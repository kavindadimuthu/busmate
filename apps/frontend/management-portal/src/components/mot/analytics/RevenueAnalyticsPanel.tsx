'use client';

import { StatsCardsContainer } from '@/components/shared/StatsCardsContainer';
import { AnalyticsBarChart } from './charts/AnalyticsBarChart';
import { AnalyticsPieChart } from './charts/AnalyticsPieChart';
import { AnalyticsLineChart } from './charts/AnalyticsLineChart';
import { AnalyticsDataTable, ProgressBar } from './charts/AnalyticsDataTable';
import { DollarSign, TrendingUp, Ticket, FileText } from 'lucide-react';
import type { RevenueAnalyticsData } from '@/data/mot/analytics';
import type { StatsCardMetric } from '@/components/shared/StatsCard';

// ── Types ────────────────────────────────────────────────────────

interface RevenueAnalyticsPanelProps {
  data: RevenueAnalyticsData;
  loading?: boolean;
}

// ── Helper ───────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  if (value >= 1000000) return `Rs ${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `Rs ${(value / 1000).toFixed(0)}K`;
  return `Rs ${value.toLocaleString()}`;
}

// ── Component ────────────────────────────────────────────────────

export function RevenueAnalyticsPanel({ data, loading = false }: RevenueAnalyticsPanelProps) {
  // KPI metrics
  const kpiMetrics: StatsCardMetric[] = [
    {
      label: 'Total Revenue',
      value: formatCurrency(data.totalRevenue),
      trend: 'up',
      trendValue: `+${data.growthRate}% vs last month`,
      trendPositiveIsGood: true,
      color: 'green',
      sparkData: [25500000, 26200000, 26800000, 27400000, 27900000, 28400000],
      icon: DollarSign,
    },
    {
      label: 'Ticket Revenue',
      value: formatCurrency(data.ticketRevenue),
      trend: 'up',
      trendValue: '+6.2% increase',
      trendPositiveIsGood: true,
      color: 'blue',
      sparkData: [22000000, 22800000, 23400000, 23900000, 24200000, 24500000],
      icon: Ticket,
    },
    {
      label: 'Permit Revenue',
      value: formatCurrency(data.permitRevenue),
      trend: 'up',
      trendValue: '+4.5% increase',
      trendPositiveIsGood: true,
      color: 'purple',
      sparkData: [2400000, 2500000, 2580000, 2650000, 2720000, 2800000],
      icon: FileText,
    },
    {
      label: 'Growth Rate',
      value: `${data.growthRate}%`,
      trend: 'up',
      trendValue: '+1.2% vs last period',
      trendPositiveIsGood: true,
      color: 'teal',
      sparkData: [6.5, 7.0, 7.4, 7.8, 8.2, 8.7],
      icon: TrendingUp,
    },
  ];

  // Top routes columns
  const topRoutesColumns = [
    { key: 'routeName', label: 'Route' },
    {
      key: 'revenue',
      label: 'Revenue',
      align: 'right' as const,
      render: (v: number) => formatCurrency(v),
    },
    {
      key: 'percentage',
      label: 'Share',
      align: 'center' as const,
      width: '140px',
      render: (v: number) => <ProgressBar value={v} max={100} color="#22c55e" />,
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

      {/* Revenue Trend */}
      <AnalyticsLineChart
        data={data.revenueTrend}
        datasets={[
          { key: 'revenue', label: 'Revenue', color: '#22c55e' },
          { key: 'tickets', label: 'Tickets Sold', color: '#3b82f6' },
        ]}
        title="Revenue & Ticket Sales Trend"
        subtitle="Last 30 days"
        loading={loading}
        showCompareToggle
        formatValue={(v) => formatCurrency(v)}
      />

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsPieChart
          data={data.revenueByCategory}
          title="Revenue by Category"
          subtitle="Revenue source breakdown"
          type="doughnut"
          loading={loading}
          centerValue={formatCurrency(data.totalRevenue)}
          centerLabel="Total"
          formatValue={formatCurrency}
        />

        <AnalyticsDataTable
          title="Top Revenue Routes"
          subtitle="Highest earning routes"
          columns={topRoutesColumns}
          data={data.topRevenueRoutes}
          loading={loading}
          showIndex
        />
      </div>

      {/* Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsBarChart
          data={data.revenueByRoute.map((d) => ({ ...d, color: d.color || '#22c55e' }))}
          title="Revenue by Top Routes"
          subtitle="Highest earning routes"
          horizontal
          loading={loading}
          formatValue={formatCurrency}
        />

        <AnalyticsBarChart
          data={data.revenueByOperator.map((d) => ({ ...d, color: d.color || '#3b82f6' }))}
          title="Revenue by Operator"
          subtitle="Operator contribution"
          horizontal
          loading={loading}
          formatValue={formatCurrency}
        />
      </div>

      {/* Daily Revenue */}
      <AnalyticsBarChart
        data={data.dailyRevenue.slice(-14).map((d) => ({ label: d.date, value: d.amount }))}
        title="Daily Revenue"
        subtitle="Last 14 days"
        color="#22c55e"
        loading={loading}
        height={250}
        formatValue={formatCurrency}
      />
    </div>
  );
}
