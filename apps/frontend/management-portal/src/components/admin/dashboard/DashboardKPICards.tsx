'use client';

import { StatsCard, StatsCardGrid } from '@busmate/ui';
import { KPIMetric } from '@/data/admin/dashboardV2';

interface DashboardKPICardsProps {
  kpis: KPIMetric[];
  loading?: boolean;
}

export function DashboardKPICards({ kpis, loading = false }: DashboardKPICardsProps) {
  if (loading || kpis.length === 0) {
    return (
      <StatsCardGrid className="xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border bg-card animate-pulse" />
        ))}
      </StatsCardGrid>
    );
  }

  return (
    <StatsCardGrid className="xl:grid-cols-5">
      {kpis.map((kpi) => (
        <StatsCard
          key={kpi.id}
          title={kpi.label}
          value={kpi.value}
          description={kpi.trendValue}
        />
      ))}
    </StatsCardGrid>
  );
}
