'use client';

import React from 'react';
import {
  Users,
  Shield,
  Truck,
  Clock,
  UserCheck,
  CircleDot,
  Car,
  UserX,
  UserPlus,
  AlertTriangle,
} from 'lucide-react';
import { StatsCardsContainer } from '@/components/shared/StatsCardsContainer';
import type { StatsCardMetric } from '@/components/shared/StatsCard';
import type { UserStatsData } from '@/data/admin/users';

// ── Types ─────────────────────────────────────────────────────────

interface UserStatsCardsProps {
  stats: UserStatsData | null;
  loading?: boolean;
}

// ── Component ─────────────────────────────────────────────────────

export function UserStatsCards({ stats, loading = false }: UserStatsCardsProps) {
  const defaultStats: UserStatsData = {
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
    pending: 0,
    byType: {
      mot: 0,
      timekeeper: 0,
      operator: 0,
      conductor: 0,
      driver: 0,
      passenger: 0,
    },
  };

  const currentStats = stats || defaultStats;

  const metrics: StatsCardMetric[] = [
    {
      label: 'Total Users',
      value: currentStats.total.toLocaleString(),
      trend: 'stable',
      trendValue: 'All users',
      trendPositiveIsGood: true,
      color: 'blue',
      sparkData: [],
      icon: Users,
    },
    {
      label: 'Active',
      value: currentStats.active.toLocaleString(),
      trend: 'stable',
      trendValue: 'Active users',
      trendPositiveIsGood: true,
      color: 'green',
      sparkData: [],
      icon: UserCheck,
    },
    {
      label: 'Inactive',
      value: currentStats.inactive.toLocaleString(),
      trend: 'stable',
      trendValue: 'Inactive users',
      trendPositiveIsGood: false,
      color: 'red',
      sparkData: [],
      icon: UserX,
    },
    {
      label: 'Suspended',
      value: currentStats.suspended.toLocaleString(),
      trend: 'stable',
      trendValue: 'Suspended users',
      trendPositiveIsGood: false,
      color: 'red',
      sparkData: [],
      icon: AlertTriangle,
    },
    {
      label: 'Pending',
      value: currentStats.pending.toLocaleString(),
      trend: 'stable',
      trendValue: 'Pending approval',
      trendPositiveIsGood: true,
      color: 'amber',
      sparkData: [],
      icon: UserPlus,
    },
    {
      label: 'MOT Officers',
      value: currentStats.byType.mot.toLocaleString(),
      trend: 'stable',
      trendValue: 'MOT staff',
      trendPositiveIsGood: true,
      color: 'purple',
      sparkData: [],
      icon: Shield,
    },
  ];

  return (
    <StatsCardsContainer
      metrics={metrics}
      loading={loading}
      columns={6}
      skeletonCount={6}
    />
  );
}
