'use client';

import {
  FileText,
  Users,
  Shield,
  Code,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import type { LogStats } from '@/data/admin/logs';

interface LogStatsCardsProps {
  stats: LogStats | null;
  loading?: boolean;
}

export function LogStatsCards({ stats, loading = false }: LogStatsCardsProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-card rounded-xl shadow-sm border border-border p-5 animate-pulse"
          >
            <div className="flex items-center">
              <div className="w-11 h-11 bg-secondary rounded-lg" />
              <div className="ml-3 flex-1">
                <div className="h-6 bg-secondary rounded w-12 mb-1.5" />
                <div className="h-3.5 bg-muted rounded w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'Total Logs',
      value: stats.totalLogs,
      icon: FileText,
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20',
      iconBg: 'bg-primary/15',
      iconColor: 'text-primary',
      textColor: 'text-primary',
    },
    {
      label: 'User Activities',
      value: stats.totalUserActivities,
      icon: Users,
      bgColor: 'bg-success/10',
      borderColor: 'border-success/20',
      iconBg: 'bg-success/15',
      iconColor: 'text-success',
      textColor: 'text-success',
    },
    {
      label: 'Security Events',
      value: stats.totalSecurityEvents,
      icon: Shield,
      bgColor: 'bg-warning/10',
      borderColor: 'border-orange-200',
      iconBg: 'bg-warning/15',
      iconColor: 'text-warning',
      textColor: 'text-warning',
    },
    {
      label: 'Application Logs',
      value: stats.totalApplicationLogs,
      icon: Code,
      bgColor: 'bg-[hsl(var(--purple-50))]',
      borderColor: 'border-[hsl(var(--purple-200))]',
      iconBg: 'bg-[hsl(var(--purple-100))]',
      iconColor: 'text-[hsl(var(--purple-600))]',
      textColor: 'text-[hsl(var(--purple-600))]',
    },
    {
      label: 'Errors',
      value: stats.errorLogs + stats.failedActions,
      icon: XCircle,
      bgColor: 'bg-destructive/10',
      borderColor: 'border-destructive/20',
      iconBg: 'bg-destructive/15',
      iconColor: 'text-destructive',
      textColor: 'text-destructive',
    },
    {
      label: 'Blocked Threats',
      value: stats.blockedThreats,
      icon: AlertTriangle,
      bgColor: 'bg-primary/10',
      borderColor: 'border-teal-200',
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-600',
      textColor: 'text-teal-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`${card.bgColor} ${card.borderColor} rounded-xl shadow-sm border-2 p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5`}
        >
          <div className="flex items-center">
            <div
              className={`${card.iconBg} ${card.iconColor} w-11 h-11 rounded-lg flex items-center justify-center`}
            >
              <card.icon className="w-5 h-5" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-2xl font-bold text-foreground">{card.value.toLocaleString()}</p>
              <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
