'use client';

import { StatsCard, StatsCardGrid } from '@busmate/ui';
import { AnalyticsBarChart } from './charts/AnalyticsBarChart';
import { AnalyticsPieChart } from './charts/AnalyticsPieChart';
import { AnalyticsDataTable } from './charts/AnalyticsDataTable';
import { Bus, Wrench, AlertCircle, Gauge } from 'lucide-react';
import type { FleetAnalyticsData } from '@/data/mot/analytics';

// ── Types ────────────────────────────────────────────────────────

interface FleetAnalyticsPanelProps {
  data: FleetAnalyticsData;
  loading?: boolean;
}

// ── Component ────────────────────────────────────────────────────

export function FleetAnalyticsPanel({ data, loading = false }: FleetAnalyticsPanelProps) {
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
        <span className={v >= 8 ? 'text-success' : v >= 7.5 ? 'text-warning' : 'text-destructive'}>
          {v.toFixed(1)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <StatsCardGrid className="lg:grid-cols-4">
        <StatsCard
          title="Total Fleet"
          value={data.totalBuses.toLocaleString()}
          icon={<Bus className="h-5 w-5" />}
          description="+12 new buses this month"
          trend={{ value: 12, direction: 'up' }}
        />
        <StatsCard
          title="Active Buses"
          value={data.activeBuses.toLocaleString()}
          icon={<Gauge className="h-5 w-5" />}
          description={`${((data.activeBuses / data.totalBuses) * 100).toFixed(1)}% of fleet`}
          trend={{ value: 0, direction: 'neutral' }}
        />
        <StatsCard
          title="In Maintenance"
          value={data.inMaintenanceBuses.toLocaleString()}
          icon={<Wrench className="h-5 w-5" />}
          description="-8 vs last week"
          trend={{ value: -8, direction: 'down' }}
        />
        <StatsCard
          title="Out of Service"
          value={data.outOfServiceBuses.toLocaleString()}
          icon={<AlertCircle className="h-5 w-5" />}
          description="-5 this week"
          trend={{ value: -5, direction: 'down' }}
        />
      </StatsCardGrid>

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
