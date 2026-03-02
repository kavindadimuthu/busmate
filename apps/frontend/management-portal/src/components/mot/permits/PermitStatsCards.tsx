'use client';

import React from 'react';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  MapPin,
} from 'lucide-react';
import { StatsCardsContainer } from '@/components/shared/StatsCardsContainer';
import type { StatsCardMetric } from '@/components/shared/StatsCard';

// ── Types ─────────────────────────────────────────────────────────

interface PermitStatsCardsProps {
  stats?: {
    totalPermits?: number;
    activePermits?: number;
    inactivePermits?: number;
    expiringSoonPermits?: number;
    permitsByOperator?: Record<string, number>;
    permitsByRouteGroup?: Record<string, number>;
  } | null;
  loading?: boolean;
}

// ── Component ─────────────────────────────────────────────────────

export function PermitStatsCards({ stats, loading = false }: PermitStatsCardsProps) {
  const safeStats = stats || {
    totalPermits: 0,
    activePermits: 0,
    inactivePermits: 0,
    expiringSoonPermits: 0,
    permitsByOperator: {},
    permitsByRouteGroup: {},
  };

  const totalOperators = Object.keys(safeStats.permitsByOperator || {}).length;
  const totalRouteGroups = Object.keys(safeStats.permitsByRouteGroup || {}).length;

  const metrics: StatsCardMetric[] = [
    {
      label: 'Total Permits',
      value: (safeStats.totalPermits || 0).toLocaleString(),
      trend: 'stable',
      trendValue: '',
      trendPositiveIsGood: true,
      color: 'blue',
      sparkData: [],
      icon: FileText,
    },
    {
      label: 'Active',
      value: (safeStats.activePermits || 0).toLocaleString(),
      trend: 'stable',
      trendValue: '',
      trendPositiveIsGood: true,
      color: 'green',
      sparkData: [],
      icon: CheckCircle,
    },
    {
      label: 'Inactive',
      value: (safeStats.inactivePermits || 0).toLocaleString(),
      trend: 'stable',
      trendValue: '',
      trendPositiveIsGood: false,
      color: 'amber',
      sparkData: [],
      icon: XCircle,
    },
    {
      label: 'Expiring Soon',
      value: (safeStats.expiringSoonPermits || 0).toLocaleString(),
      trend: 'stable',
      trendValue: '',
      trendPositiveIsGood: false,
      color: 'red',
      sparkData: [],
      icon: Clock,
    },
    {
      label: 'Operators',
      value: totalOperators.toLocaleString(),
      trend: 'stable',
      trendValue: '',
      trendPositiveIsGood: true,
      color: 'purple',
      sparkData: [],
      icon: Users,
    },
    {
      label: 'Route Groups',
      value: totalRouteGroups.toLocaleString(),
      trend: 'stable',
      trendValue: '',
      trendPositiveIsGood: true,
      color: 'teal',
      sparkData: [],
      icon: MapPin,
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
