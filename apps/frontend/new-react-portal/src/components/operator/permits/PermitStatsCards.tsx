'use client';

import { FileText, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { StatsCard, StatsCardGrid } from '@busmate/ui';
import type { OperatorPermitStatistics } from '@/data/operator/permits';

interface PermitStatsCardsProps {
  stats: OperatorPermitStatistics | null;
  loading?: boolean;
}

export function PermitStatsCards({ stats, loading = false }: PermitStatsCardsProps) {
  const safeStats: OperatorPermitStatistics = stats ?? {
    totalPermits: 0,
    activePermits: 0,
    inactivePermits: 0,
    pendingPermits: 0,
    expiredPermits: 0,
    expiringSoonPermits: 0,
  };

  if (loading) {
    return (
      <StatsCardGrid className="lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border bg-card animate-pulse" />
        ))}
      </StatsCardGrid>
    );
  }

  return (
    <StatsCardGrid className="lg:grid-cols-6">
      <StatsCard
        title="Total Permits"
        value={(safeStats.totalPermits ?? 0).toLocaleString()}
        icon={<FileText className="h-5 w-5" />}
      />
      <StatsCard
        title="Active"
        value={(safeStats.activePermits ?? 0).toLocaleString()}
        icon={<CheckCircle className="h-5 w-5" />}
      />
      <StatsCard
        title="Inactive"
        value={(safeStats.inactivePermits ?? 0).toLocaleString()}
        icon={<XCircle className="h-5 w-5" />}
      />
      <StatsCard
        title="Pending"
        value={(safeStats.pendingPermits ?? 0).toLocaleString()}
        icon={<Clock className="h-5 w-5" />}
      />
      <StatsCard
        title="Expired"
        value={(safeStats.expiredPermits ?? 0).toLocaleString()}
        icon={<XCircle className="h-5 w-5" />}
      />
      <StatsCard
        title="Expiring Soon"
        value={(safeStats.expiringSoonPermits ?? 0).toLocaleString()}
        icon={<AlertTriangle className="h-5 w-5" />}
      />
    </StatsCardGrid>
  );
}
