'use client';

import * as React from 'react';
import { Inbox, Send, Clock3, CheckCircle } from 'lucide-react';
import { StatsCard, StatsCardGrid } from '@busmate/ui';

interface NotificationStats {
  totalReceived: number;
  totalSent: number;
  totalScheduled: number;
  averageReadRate: number;
}

interface NotificationsStatsCardsProps {
  stats: NotificationStats;
}

export function NotificationsStatsCards({ stats }: NotificationsStatsCardsProps) {
  return (
    <StatsCardGrid className="lg:grid-cols-4">
      <StatsCard
        title="Total Received"
        value={stats.totalReceived.toLocaleString()}
        icon={<Inbox className="h-5 w-5" />}
      />
      <StatsCard
        title="Total Sent"
        value={stats.totalSent.toLocaleString()}
        icon={<Send className="h-5 w-5" />}
      />
      <StatsCard
        title="Scheduled"
        value={stats.totalScheduled.toLocaleString()}
        icon={<Clock3 className="h-5 w-5" />}
      />
      <StatsCard
        title="Avg Read Rate"
        value={`${stats.averageReadRate}%`}
        icon={<CheckCircle className="h-5 w-5" />}
      />
    </StatsCardGrid>
  );
}
