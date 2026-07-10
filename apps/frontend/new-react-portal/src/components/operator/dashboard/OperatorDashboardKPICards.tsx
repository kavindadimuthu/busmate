'use client';

import { Bus, DollarSign, Route, Clock, Users, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { StatsCard, StatsCardGrid } from '@busmate/ui';
import { KPIMetric } from '@/data/operator/dashboard';

const ICON_MAP: Record<string, LucideIcon> = {
  'kpi-fleet':        Bus,
  'kpi-revenue':      DollarSign,
  'kpi-active-trips': Route,
  'kpi-ontime':       Clock,
  'kpi-staff':        Users,
  'kpi-maintenance':  Wrench,
};

interface OperatorDashboardKPICardsProps {
  kpis: KPIMetric[];
  loading?: boolean;
}

export function OperatorDashboardKPICards({ kpis, loading = false }: OperatorDashboardKPICardsProps) {
  if (loading || kpis.length === 0) {
    return (
      <StatsCardGrid className="grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border bg-card animate-pulse" />
        ))}
      </StatsCardGrid>
    );
  }

  return (
    <StatsCardGrid className="grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
      {kpis.map((kpi) => {
        const Icon = ICON_MAP[kpi.id] ?? Bus;
        return (
          <StatsCard
            key={kpi.id}
            title={kpi.label}
            value={kpi.value}
            icon={<Icon className="h-5 w-5" />}
            description={kpi.trendValue}
          />
        );
      })}
    </StatsCardGrid>
  );
}
