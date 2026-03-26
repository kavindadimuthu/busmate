'use client';

import type { getNotificationStats } from '@/data/admin';

type NotificationStats = ReturnType<typeof getNotificationStats>;

interface Props {
  stats: NotificationStats;
}

export function NotificationBreakdownPanels({ stats }: Props) {
  const channelColors: Record<string, string> = {
    push: 'bg-success',
    email: 'bg-primary/80',
    sms: 'bg-warning',
    'in-app': 'bg-[hsl(var(--purple-500))]',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Audience Breakdown */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
          Audience Breakdown
        </h3>
        <div className="space-y-3">
          {stats.audienceBreakdown.map((item, idx) => {
            const maxCount = stats.audienceBreakdown[0]?.count || 1;
            const pct = (item.count / maxCount) * 100;
            return (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-foreground/80 capitalize">
                    {item.audience.replace('_', ' ')}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{item.count}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/80 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Channel Distribution */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
          Channel Distribution
        </h3>
        <div className="space-y-3">
          {stats.channelBreakdown.map((item, idx) => {
            const maxCount = stats.channelBreakdown[0]?.count || 1;
            const pct = (item.count / maxCount) * 100;
            return (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-foreground/80 capitalize">{item.channel}</span>
                  <span className="text-sm font-semibold text-foreground">{item.count}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${channelColors[item.channel] || 'bg-secondary'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
