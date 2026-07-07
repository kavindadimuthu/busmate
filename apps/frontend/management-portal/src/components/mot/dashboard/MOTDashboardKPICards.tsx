'use client';

import { Bus, Route, Users, MapPin, Clock, DollarSign } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { StatsCard, StatsCardGrid } from '@busmate/ui';
import { KPIMetric } from '@/data/mot/dashboard';

const ICON_MAP: Record<string, LucideIcon> = {
  'kpi-buses':        Bus,
  'kpi-active-trips': Route,
  'kpi-passengers':   Users,
  'kpi-ontime':       Clock,
  'kpi-routes':       MapPin,
  'kpi-revenue':      DollarSign,
};

interface MOTDashboardKPICardsProps {
  kpis: KPIMetric[];
  loading?: boolean;
}

export function MOTDashboardKPICards({ kpis, loading = false }: MOTDashboardKPICardsProps) {
  if (loading) {
    return (
      <StatsCardGrid className="lg:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border bg-card animate-pulse" />
        ))}
      </StatsCardGrid>
    );
  }

  return (
    <StatsCardGrid className="lg:grid-cols-3 2xl:grid-cols-6">
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
