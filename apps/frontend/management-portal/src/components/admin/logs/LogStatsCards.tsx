'use client';

import {
  FileText,
  Users,
  Shield,
  Code,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { StatsCard, StatsCardGrid } from '@busmate/ui';
import type { LogStats } from '@/data/admin/logs';

interface LogStatsCardsProps {
  stats: LogStats | null;
  loading?: boolean;
}

export function LogStatsCards({ stats, loading = false }: LogStatsCardsProps) {
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
      <StatsCard
        title="Total Logs"
        value={stats.totalLogs.toLocaleString()}
        icon={<FileText className="h-5 w-5" />}
      />
      <StatsCard
        title="User Activities"
        value={stats.totalUserActivities.toLocaleString()}
        icon={<Users className="h-5 w-5" />}
      />
      <StatsCard
        title="Security Events"
        value={stats.totalSecurityEvents.toLocaleString()}
        icon={<Shield className="h-5 w-5" />}
      />
      <StatsCard
        title="Application Logs"
        value={stats.totalApplicationLogs.toLocaleString()}
        icon={<Code className="h-5 w-5" />}
      />
      <StatsCard
        title="Errors"
        value={(stats.errorLogs + stats.failedActions).toLocaleString()}
        icon={<XCircle className="h-5 w-5" />}
      />
      <StatsCard
        title="Blocked Threats"
        value={stats.blockedThreats.toLocaleString()}
        icon={<AlertTriangle className="h-5 w-5" />}
      />
    </StatsCardGrid>
  );
}
