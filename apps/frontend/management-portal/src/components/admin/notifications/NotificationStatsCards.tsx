'use client';

import {
  Bell,
  Send,
  Clock,
  FileEdit,
  AlertTriangle,
  Users,
} from 'lucide-react';
import { StatsCard, StatsCardGrid } from '@busmate/ui';
import type { NotificationStats } from '@/data/admin/notifications';

interface NotificationStatsCardsProps {
  stats: NotificationStats | null;
  loading?: boolean;
}

export function NotificationStatsCards({ stats, loading = false }: NotificationStatsCardsProps) {
  if (loading || !stats) {
    return (
      <StatsCardGrid className="lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border bg-card animate-pulse" />
        ))}
      </StatsCardGrid>
    );
  }

  return (
    <StatsCardGrid className="lg:grid-cols-3 xl:grid-cols-6">
      <StatsCard
        title="Total"
        value={stats.totalNotifications.toLocaleString()}
        icon={<Bell className="h-5 w-5" />}
        description={`${stats.averageReadRate}% avg read rate`}
      />
      <StatsCard
        title="Sent"
        value={stats.totalSent.toLocaleString()}
        icon={<Send className="h-5 w-5" />}
        description={`${stats.totalRecipients.toLocaleString()} recipients`}
      />
      <StatsCard
        title="Scheduled"
        value={stats.totalScheduled.toLocaleString()}
        icon={<Clock className="h-5 w-5" />}
        description="Pending delivery"
      />
      <StatsCard
        title="Drafts"
        value={stats.totalDraft.toLocaleString()}
        icon={<FileEdit className="h-5 w-5" />}
        description="Awaiting review"
      />
      <StatsCard
        title="Critical"
        value={stats.criticalCount.toLocaleString()}
        icon={<AlertTriangle className="h-5 w-5" />}
        description={`${stats.warningCount} warnings`}
      />
      <StatsCard
        title="Audiences"
        value={stats.audienceBreakdown.length.toLocaleString()}
        icon={<Users className="h-5 w-5" />}
        description={`${stats.channelBreakdown.length} channels`}
      />
    </StatsCardGrid>
  );
}
