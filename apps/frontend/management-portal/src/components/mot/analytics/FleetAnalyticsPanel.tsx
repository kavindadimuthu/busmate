'use client';

import { StatsCardsContainer } from '@/components/shared/StatsCardsContainer';
import { AnalyticsBarChart } from './charts/AnalyticsBarChart';
import { AnalyticsPieChart } from './charts/AnalyticsPieChart';
import { AnalyticsDataTable } from './charts/AnalyticsDataTable';
import { Bus, Wrench, AlertCircle, Gauge } from 'lucide-react';
import type { FleetAnalyticsData } from '@/data/mot/analytics';
import type { StatsCardMetric } from '@/components/shared/StatsCard';

// ── Types ────────────────────────────────────────────────────────

interface FleetAnalyticsPanelProps {
  data: FleetAnalyticsData;
  loading?: boolean;
}

// ── Component ────────────────────────────────────────────────────

export function FleetAnalyticsPanel({ data, loading = false }: FleetAnalyticsPanelProps) {
  // KPI metrics
  const kpiMetrics: StatsCardMetric[] = [
    {
      label: 'Total Fleet',
      value: data.totalBuses.toLocaleString(),
      trend: 'up',
      trendValue: '+12 new buses this month',
      trendPositiveIsGood: true,
      color: 'blue',
      sparkData: [1480, 1495, 1505, 1512, 1518, 1523],
      icon: Bus,
    },
    {
      label: 'Active Buses',
      value: data.activeBuses.toLocaleString(),
      trend: 'stable',
      trendValue: `${((data.activeBuses / data.totalBuses) * 100).toFixed(1)}% of fleet`,
      trendPositiveIsGood: true,
      color: 'green',
      sparkData: [1235, 1240, 1242, 1245, 1246, 1247],
      icon: Gauge,
    },
    {
      label: 'In Maintenance',
      value: data.inMaintenanceBuses.toLocaleString(),
      trend: 'down',
      trendValue: '-8 vs last week',
      trendPositiveIsGood: false,
      color: 'amber',
      sparkData: [180, 175, 170, 165, 160, 156],
      icon: Wrench,
    },
    {
      label: 'Out of Service',
      value: data.outOfServiceBuses.toLocaleString(),
      trend: 'down',
      trendValue: '-5 this week',
      trendPositiveIsGood: false,
      color: 'red',
      sparkData: [140, 135, 130, 128, 125, 120],
      icon: AlertCircle,
    },
  ];

  // Maintenance schedule columns
  const maintenanceColumns = [
    { key: 'registrationNumber', label: 'Bus Reg.' },
    { key: 'maintenanceType', label: 'Type' },
    {
      key: 'nextMaintenanceDate',
      label: 'Scheduled Date',
      render: (v: string) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    },
  ];

  // Bus performance columns
  const performanceColumns = [
    { key: 'registrationNumber', label: 'Bus Reg.' },
    {
      key: 'trips',
      label: 'Trips',
      align: 'right' as const,
      render: (v: number) => v.toLocaleString(),
    },
    {
      key: 'distance',
      label: 'Distance (km)',
      align: 'right' as const,
      render: (v: number) => v.toLocaleString(),
    },
    {
      key: 'fuelEfficiency',
      label: 'Fuel Eff. (km/L)',
      align: 'right' as const,
      render: (v: number) => (
        <span className={v >= 8 ? 'text-green-600' : v >= 7.5 ? 'text-amber-600' : 'text-red-600'}>
          {v.toFixed(1)}
        </span>
      ),
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
          data={data.busesByStatus}
          title="Fleet Status"
          subtitle="Current operational status"
          type="doughnut"
          loading={loading}
          centerValue={`${data.fleetUtilization.toFixed(0)}%`}
          centerLabel="Utilization"
        />

        <AnalyticsPieChart
          data={data.busesByOperator}
          title="Buses by Operator"
          subtitle="Fleet ownership distribution"
          type="doughnut"
          loading={loading}
          centerValue={data.totalBuses.toLocaleString()}
          centerLabel="Total"
        />

        <AnalyticsPieChart
          data={data.busesByCapacity}
          title="Buses by Capacity"
          subtitle="Seating capacity distribution"
          type="doughnut"
          loading={loading}
          centerValue={data.totalBuses.toLocaleString()}
          centerLabel="Total"
        />
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsDataTable
          title="Upcoming Maintenance"
          subtitle="Next 5 scheduled services"
          columns={maintenanceColumns}
          data={data.maintenanceSchedule}
          loading={loading}
          showIndex
        />

        <AnalyticsDataTable
          title="Top Performing Buses"
          subtitle="By trip count this month"
          columns={performanceColumns}
          data={data.busPerformance}
          loading={loading}
          showIndex
        />
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsBarChart
          data={data.busesByOperator.map((d) => ({ label: d.label, value: d.value, color: d.color }))}
          title="Buses per Operator"
          subtitle="Fleet distribution by ownership"
          horizontal
          loading={loading}
        />

        <AnalyticsBarChart
          data={data.busesByCapacity.map((d) => ({ label: d.label, value: d.value, color: d.color }))}
          title="Buses by Capacity Range"
          subtitle="Seating capacity groups"
          loading={loading}
        />
      </div>
    </div>
  );
}
