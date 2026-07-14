'use client';

import { StatsCard, StatsCardGrid } from '@busmate/ui';
import { AnalyticsBarChart } from './charts/AnalyticsBarChart';
import { AnalyticsPieChart } from './charts/AnalyticsPieChart';
import { AnalyticsLineChart } from './charts/AnalyticsLineChart';
import { AnalyticsDataTable, ProgressBar } from './charts/AnalyticsDataTable';
import { DollarSign, TrendingUp, Ticket, FileText } from 'lucide-react';
import type { RevenueAnalyticsData } from '@/data/mot/analytics';

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
      <StatsCardGrid className="lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(data.totalRevenue)}
          icon={<DollarSign className="h-5 w-5" />}
          description={`+${data.growthRate}% vs last month`}
          trend={{ value: data.growthRate, direction: 'up' }}
        />
        <StatsCard
          title="Ticket Revenue"
          value={formatCurrency(data.ticketRevenue)}
          icon={<Ticket className="h-5 w-5" />}
          description="+6.2% increase"
          trend={{ value: 6.2, direction: 'up' }}
        />
        <StatsCard
          title="Permit Revenue"
          value={formatCurrency(data.permitRevenue)}
          icon={<FileText className="h-5 w-5" />}
          description="+4.5% increase"
          trend={{ value: 4.5, direction: 'up' }}
        />
        <StatsCard
          title="Growth Rate"
          value={`${data.growthRate}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          description="+1.2% vs last period"
          trend={{ value: 1.2, direction: 'up' }}
        />
      </StatsCardGrid>

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
