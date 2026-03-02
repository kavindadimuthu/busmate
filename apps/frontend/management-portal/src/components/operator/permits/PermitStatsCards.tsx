'use client';

import React from 'react';
import { FileText, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { StatsCardsContainer } from '@/components/shared/StatsCardsContainer';
import type { StatsCardMetric } from '@/components/shared/StatsCard';
import type { OperatorPermitStatistics } from '@/data/operator/permits';

// ── Types ─────────────────────────────────────────────────────────

interface PermitStatsCardsProps {
  stats: OperatorPermitStatistics | null;
  loading?: boolean;
}

// ── Component ─────────────────────────────────────────────────────

export function PermitStatsCards({ stats, loading = false }: PermitStatsCardsProps) {
  const safeStats: OperatorPermitStatistics = stats ?? {
    totalPermits: 0,
    activePermits: 0,
    inactivePermits: 0,
    pendingPermits: 0,
    expiredPermits: 0,
    expiringSoonPermits: 0,
  };

  const metrics: StatsCardMetric[] = [
    {
      label: 'Total Permits',
      value: (safeStats.totalPermits ?? 0).toLocaleString(),
      trend: 'stable',
      trendValue: '',
      trendPositiveIsGood: true,
      color: 'blue',
      sparkData: [],
      icon: FileText,
    },
    {
      label: 'Active',
      value: (safeStats.activePermits ?? 0).toLocaleString(),
      trend: 'stable',
      trendValue: '',
      trendPositiveIsGood: true,
      color: 'green',
      sparkData: [],
      icon: CheckCircle,
    },
    {
      label: 'Inactive',
      value: (safeStats.inactivePermits ?? 0).toLocaleString(),
      trend: 'stable',
      trendValue: '',
      trendPositiveIsGood: false,
      color: 'amber',
      sparkData: [],
      icon: XCircle,
    },
    {
      label: 'Pending',
      value: (safeStats.pendingPermits ?? 0).toLocaleString(),
      trend: 'stable',
      trendValue: '',
      trendPositiveIsGood: false,
      color: 'amber',
      sparkData: [],
      icon: Clock,
    },
    {
      label: 'Expired',
      value: (safeStats.expiredPermits ?? 0).toLocaleString(),
      trend: 'stable',
      trendValue: '',
      trendPositiveIsGood: false,
      color: 'red',
      sparkData: [],
      icon: XCircle,
    },
    {
      label: 'Expiring Soon',
      value: (safeStats.expiringSoonPermits ?? 0).toLocaleString(),
      trend: 'stable',
      trendValue: '',
      trendPositiveIsGood: false,
      color: 'amber',
      sparkData: [],
      icon: AlertTriangle,
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
