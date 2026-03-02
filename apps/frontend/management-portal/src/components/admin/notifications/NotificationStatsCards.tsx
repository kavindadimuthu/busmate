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
            <div className="h-4 bg-gray-200 rounded w-20 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-24" />
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
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      valueColor: 'text-blue-700',
    },
    {
      label: 'Sent',
      value: stats.totalSent,
      sub: `${stats.totalRecipients.toLocaleString()} recipients`,
      icon: Send,
      bg: 'bg-green-50',
      border: 'border-green-200',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      valueColor: 'text-green-700',
    },
    {
      label: 'Scheduled',
      value: stats.totalScheduled,
      sub: 'Pending delivery',
      icon: Clock,
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      valueColor: 'text-amber-700',
    },
    {
      label: 'Drafts',
      value: stats.totalDraft,
      sub: 'Awaiting review',
      icon: FileEdit,
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      valueColor: 'text-purple-700',
    },
    {
      label: 'Critical',
      value: stats.criticalCount,
      sub: `${stats.warningCount} warnings`,
      icon: AlertTriangle,
      bg: 'bg-red-50',
      border: 'border-red-200',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      valueColor: 'text-red-700',
    },
    {
      label: 'Audiences',
      value: stats.audienceBreakdown.length,
      sub: `${stats.channelBreakdown.length} channels`,
      icon: Users,
      bg: 'bg-teal-50',
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
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {card.label}
              </span>
              <div className={`${card.iconBg} p-1.5 rounded-lg`}>
                <Icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${card.valueColor}`}>
              {card.value.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">{card.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
