'use client';

import {
  Bell,
  Send,
  Clock,
  FileEdit,
  AlertTriangle,
  Users,
} from 'lucide-react';
import type { NotificationStats } from '@/data/admin/notifications';

interface NotificationStatsCardsProps {
  stats: NotificationStats | null;
  loading?: boolean;
}

export function NotificationStatsCards({ stats, loading = false }: NotificationStatsCardsProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border-2 p-5 animate-pulse"
          >
            <div className="h-4 bg-secondary rounded w-20 mb-3" />
            <div className="h-8 bg-secondary rounded w-16 mb-2" />
            <div className="h-3 bg-secondary rounded w-24" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'Total',
      value: stats.totalNotifications,
      sub: `${stats.averageReadRate}% avg read rate`,
      icon: Bell,
      bg: 'bg-primary/10',
      border: 'border-primary/20',
      iconBg: 'bg-primary/15',
      iconColor: 'text-primary',
      valueColor: 'text-primary',
    },
    {
      label: 'Sent',
      value: stats.totalSent,
      sub: `${stats.totalRecipients.toLocaleString()} recipients`,
      icon: Send,
      bg: 'bg-success/10',
      border: 'border-success/20',
      iconBg: 'bg-success/15',
      iconColor: 'text-success',
      valueColor: 'text-success',
    },
    {
      label: 'Scheduled',
      value: stats.totalScheduled,
      sub: 'Pending delivery',
      icon: Clock,
      bg: 'bg-warning/10',
      border: 'border-warning/20',
      iconBg: 'bg-warning/15',
      iconColor: 'text-warning',
      valueColor: 'text-warning',
    },
    {
      label: 'Drafts',
      value: stats.totalDraft,
      sub: 'Awaiting review',
      icon: FileEdit,
      bg: 'bg-[hsl(var(--purple-50))]',
      border: 'border-[hsl(var(--purple-200))]',
      iconBg: 'bg-[hsl(var(--purple-100))]',
      iconColor: 'text-[hsl(var(--purple-600))]',
      valueColor: 'text-[hsl(var(--purple-700))]',
    },
    {
      label: 'Critical',
      value: stats.criticalCount,
      sub: `${stats.warningCount} warnings`,
      icon: AlertTriangle,
      bg: 'bg-destructive/10',
      border: 'border-destructive/20',
      iconBg: 'bg-destructive/15',
      iconColor: 'text-destructive',
      valueColor: 'text-destructive',
    },
    {
      label: 'Audiences',
      value: stats.audienceBreakdown.length,
      sub: `${stats.channelBreakdown.length} channels`,
      icon: Users,
      bg: 'bg-primary/10',
      border: 'border-teal-200',
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-600',
      valueColor: 'text-teal-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`${card.bg} ${card.border} rounded-xl border-2 p-5 hover:shadow-md transition-all duration-200`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {card.label}
              </span>
              <div className={`${card.iconBg} p-1.5 rounded-lg`}>
                <Icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${card.valueColor}`}>
              {card.value.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
