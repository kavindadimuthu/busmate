'use client';

import { FileText, CheckCircle, PauseCircle, XCircle, AlertTriangle, Archive } from 'lucide-react';
import { StatsCard, StatsCardGrid } from '@busmate/ui';
import type { PermitStatistics } from '@/hooks/operator/permits/useOperatorPermits';

export function PermitStatsCards({ stats, loading = false }: { stats: PermitStatistics | null; loading?: boolean }) {
  if (loading || !stats) {
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
      <StatsCard title="Total" value={stats.total.toLocaleString()} icon={<FileText className="h-5 w-5" />} />
      <StatsCard title="Active" value={stats.active.toLocaleString()} icon={<CheckCircle className="h-5 w-5" />} />
      <StatsCard title="Expiring in 30 days" value={stats.expiringSoon.toLocaleString()} icon={<AlertTriangle className="h-5 w-5" />} />
      <StatsCard title="Expired" value={stats.expired.toLocaleString()} icon={<XCircle className="h-5 w-5" />} />
      <StatsCard title="Suspended by MOT" value={stats.suspended.toLocaleString()} icon={<PauseCircle className="h-5 w-5" />} />
      <StatsCard title="Withdrawn" value={stats.withdrawn.toLocaleString()} icon={<Archive className="h-5 w-5" />} />
    </StatsCardGrid>
  );
}
