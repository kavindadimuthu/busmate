'use client';

import Link from 'next/link';
import { Activity, ArrowUpRight, ShieldAlert, User, DollarSign, Cpu } from 'lucide-react';
import { ActivityEntry } from '@/data/admin/dashboardV2';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const ACTOR_ICON: Record<ActivityEntry['actorType'], React.ReactNode> = {
  user:        <User className="h-3.5 w-3.5" />,
  system:      <Cpu className="h-3.5 w-3.5" />,
  security:    <ShieldAlert className="h-3.5 w-3.5" />,
  transaction: <DollarSign className="h-3.5 w-3.5" />,
};

const ACTOR_STYLE: Record<ActivityEntry['actorType'], string> = {
  user:        'bg-primary/15 text-primary',
  system:      'bg-muted text-muted-foreground',
  security:    'bg-warning/15 text-warning',
  transaction: 'bg-[hsl(var(--purple-100))] text-[hsl(var(--purple-600))]',
};

const SEVERITY_STYLE: Record<ActivityEntry['severity'], string> = {
  normal:   '',
  warning:  'bg-warning/10 border-l-2 border-l-amber-400',
  critical: 'bg-destructive/10 border-l-2 border-l-red-500',
};

interface DashboardActivityFeedProps {
  activity: ActivityEntry[];
  loading?: boolean;
}

export function DashboardActivityFeed({ activity, loading = false }: DashboardActivityFeedProps) {
  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 animate-pulse">
        <div className="h-5 bg-muted rounded w-36 mb-5" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-3 mb-4">
            <div className="w-7 h-7 rounded-full bg-muted shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground text-sm">Recent Activity</h3>
        </div>
        <Link
          href="/admin/logs"
          className="flex items-center gap-1 text-xs text-primary hover:text-primary font-medium"
        >
          View logs <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-3.5 top-0 bottom-0 w-px bg-muted" aria-hidden />

        <div className="space-y-1">
          {activity.map((entry) => (
            <div
              key={entry.id}
              className={`relative flex gap-3 pl-1 pr-3 py-2 rounded-lg transition-colors ${SEVERITY_STYLE[entry.severity]}`}
            >
              {/* Avatar */}
              <div
                className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${ACTOR_STYLE[entry.actorType]}`}
              >
                {ACTOR_ICON[entry.actorType]}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground leading-snug">
                  <span className="font-semibold">{entry.actor}</span>
                  {' '}
                  <span className="text-muted-foreground">{entry.action}</span>
                </p>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">{entry.target}</p>
              </div>

              {/* Timestamp */}
              <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">{timeAgo(entry.timestamp)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
