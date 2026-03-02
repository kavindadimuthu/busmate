'use client';

import { StatsCardsContainer } from '@/components/shared/StatsCardsContainer';
import { AnalyticsBarChart } from './charts/AnalyticsBarChart';
import { AnalyticsPieChart } from './charts/AnalyticsPieChart';
import { AnalyticsLineChart } from './charts/AnalyticsLineChart';
import { AnalyticsDataTable, RatingStars, ProgressBar } from './charts/AnalyticsDataTable';
import { Users, Clock, Search, UserCheck } from 'lucide-react';
import type { StaffAnalyticsData } from '@/data/mot/analytics';
import type { StatsCardMetric } from '@/components/shared/StatsCard';

// ── Types ────────────────────────────────────────────────────────

interface StaffAnalyticsPanelProps {
  data: StaffAnalyticsData;
  loading?: boolean;
}

// ── Component ────────────────────────────────────────────────────

export function StaffAnalyticsPanel({ data, loading = false }: StaffAnalyticsPanelProps) {
  // KPI metrics
  const kpiMetrics: StatsCardMetric[] = [
    {
      label: 'Total Staff',
      value: data.totalStaff.toLocaleString(),
      trend: 'up',
      trendValue: '+45 new hires this month',
      trendPositiveIsGood: true,
      color: 'blue',
      sparkData: [4380, 4420, 4450, 4480, 4500, 4521],
      icon: Users,
    },
    {
      label: 'Active Staff',
      value: data.activeStaff.toLocaleString(),
      trend: 'stable',
      trendValue: `${((data.activeStaff / data.totalStaff) * 100).toFixed(1)}% active`,
      trendPositiveIsGood: true,
      color: 'green',
      sparkData: [4050, 4070, 4085, 4100, 4115, 4123],
      icon: UserCheck,
    },
    {
      label: 'Timekeepers',
      value: data.timekeepers.toLocaleString(),
      trend: 'up',
      trendValue: '+18 this month',
      trendPositiveIsGood: true,
      color: 'purple',
      sparkData: [2280, 2300, 2315, 2328, 2340, 2345],
      icon: Clock,
    },
    {
      label: 'Inspectors',
      value: data.inspectors.toLocaleString(),
      trend: 'up',
      trendValue: '+12 this month',
      trendPositiveIsGood: true,
      color: 'teal',
      sparkData: [1720, 1735, 1750, 1760, 1770, 1778],
      icon: Search,
    },
  ];

  // Staff performance columns
  const performanceColumns = [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    {
      key: 'shiftsCompleted',
      label: 'Shifts',
      align: 'right' as const,
    },
    {
      key: 'attendance',
      label: 'Attendance',
      align: 'center' as const,
      width: '140px',
      render: (v: number) => <ProgressBar value={v} color={v >= 98 ? '#22c55e' : v >= 95 ? '#f59e0b' : '#ef4444'} />,
    },
    {
      key: 'rating',
      label: 'Rating',
      align: 'center' as const,
      render: (v: number) => <RatingStars rating={v} />,
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AnalyticsPieChart
          data={data.staffByStatus}
          title="Staff Status"
          subtitle="Current availability"
          type="doughnut"
          loading={loading}
          centerValue={`${((data.activeStaff / data.totalStaff) * 100).toFixed(0)}%`}
          centerLabel="Active"
        />

        <AnalyticsPieChart
          data={data.staffByType}
          title="Staff by Role"
          subtitle="Role distribution"
          type="doughnut"
          loading={loading}
          centerValue={data.totalStaff.toLocaleString()}
          centerLabel="Total"
        />

        <AnalyticsPieChart
          data={data.staffByProvince}
          title="Staff by Province"
          subtitle="Geographic distribution"
          type="doughnut"
          loading={loading}
          centerValue={data.totalStaff.toLocaleString()}
          centerLabel="Total"
        />
      </div>

      {/* Attendance Trend */}
      <AnalyticsLineChart
        data={data.attendanceTrend}
        datasets={[
          { key: 'present', label: 'Present', color: '#22c55e' },
          { key: 'absent', label: 'Absent', color: '#ef4444' },
        ]}
        title="Attendance Trend"
        subtitle="Last 7 days"
        loading={loading}
        showCompareToggle
      />

      {/* Staff Performance Table */}
      <AnalyticsDataTable
        title="Top Performing Staff"
        subtitle="Based on attendance and ratings"
        columns={performanceColumns}
        data={data.staffPerformance}
        loading={loading}
        showIndex
      />

      {/* Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsBarChart
          data={data.staffByProvince.map((d) => ({ label: d.label, value: d.value, color: d.color }))}
          title="Staff per Province"
          subtitle="Regional distribution"
          horizontal
          loading={loading}
        />

        <AnalyticsBarChart
          data={data.staffByType.map((d) => ({ label: d.label, value: d.value, color: d.color }))}
          title="Staff by Role Type"
          subtitle="Role breakdown"
          loading={loading}
        />
      </div>
    </div>
  );
}
