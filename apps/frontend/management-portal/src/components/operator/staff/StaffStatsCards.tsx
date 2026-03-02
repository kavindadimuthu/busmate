'use client';

import { Users, Car, UserCheck, CheckCircle, Clock, Calendar } from 'lucide-react';
import { StatsCardsContainer } from '@/components/shared/StatsCardsContainer';
import type { StatsCardMetric } from '@/components/shared/StatsCard';
import type { StaffStats } from '@/data/operator/staff';

// ── Types ─────────────────────────────────────────────────────────

interface StaffStatsCardsProps {
  stats?: StaffStats | null;
  loading?: boolean;
}

// ── Default stats ─────────────────────────────────────────────────

const EMPTY_STATS: StaffStats = {
  totalStaff: 0,
  totalDrivers: 0,
  totalConductors: 0,
  activeStaff: 0,
  availableNow: 0,
  assignedNow: 0,
  onLeave: 0,
};

// ── Component ─────────────────────────────────────────────────────

export function StaffStatsCards({ stats, loading = false }: StaffStatsCardsProps) {
  const s = stats ?? EMPTY_STATS;

  const metrics: StatsCardMetric[] = [
    {
      label: 'Total Staff',
      value: s.totalStaff.toLocaleString(),
      trend: 'stable' as const,
      trendValue: '',
      trendPositiveIsGood: true,
      color: 'blue' as const,
      sparkData: [],
      icon: Users,
    },
    {
      label: 'Drivers',
      value: s.totalDrivers.toLocaleString(),
      trend: 'stable' as const,
      trendValue: '',
      trendPositiveIsGood: true,
      color: 'green' as const,
      sparkData: [],
      icon: Car,
    },
    {
      label: 'Conductors',
      value: s.totalConductors.toLocaleString(),
      trend: 'stable' as const,
      trendValue: '',
      trendPositiveIsGood: true,
      color: 'purple' as const,
      sparkData: [],
      icon: UserCheck,
    },
    {
      label: 'Active',
      value: s.activeStaff.toLocaleString(),
      trend: 'stable' as const,
      trendValue: '',
      trendPositiveIsGood: true,
      color: 'teal' as const,
      sparkData: [],
      icon: CheckCircle,
    },
    {
      label: 'Assigned Now',
      value: s.assignedNow.toLocaleString(),
      trend: 'stable' as const,
      trendValue: '',
      trendPositiveIsGood: true,
      color: 'amber' as const,
      sparkData: [],
      icon: Clock,
    },
    {
      label: 'On Leave',
      value: s.onLeave.toLocaleString(),
      trend: 'stable' as const,
      trendValue: '',
      trendPositiveIsGood: false,
      color: 'red' as const,
      sparkData: [],
      icon: Calendar,
    },
  ];

  return (
    <StatsCardsContainer
      metrics={metrics}
      columns={6}
      loading={loading}
      skeletonCount={6}
    />
  );
}
