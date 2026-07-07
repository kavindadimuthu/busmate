'use client';

import { User, Cpu, Building2, Car, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { ActivityEntry } from '@/data/mot/dashboard';

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
  staff:    <User className="h-3.5 w-3.5" />,
  system:   <Cpu className="h-3.5 w-3.5" />,
  operator: <Building2 className="h-3.5 w-3.5" />,
  driver:   <Car className="h-3.5 w-3.5" />,
};

const ACTOR_STYLE: Record<ActivityEntry['actorType'], string> = {
  staff:    'bg-primary/15 text-primary',
  system:   'bg-muted text-muted-foreground',
  operator: 'bg-[hsl(var(--purple-100))] text-[hsl(var(--purple-600))]',
  driver:   'bg-teal-100 text-teal-600',
};

const SEVERITY_STYLE: Record<ActivityEntry['severity'], string> = {
  normal:   '',
  warning:  'bg-warning/10 border-l-2 border-l-amber-400',
  critical: 'bg-destructive/10 border-l-2 border-l-red-500',
};

interface MOTDashboardActivityFeedProps {
  activity: ActivityEntry[];
  loading?: boolean;
}

export function MOTDashboardActivityFeed({ activity, loading = false }: MOTDashboardActivityFeedProps) {
  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-32 bg-muted rounded" />
          <div className="h-4 w-16 bg-muted rounded" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
        <Link
          href="/mot/activity"
          className="text-xs text-primary hover:text-primary flex items-center gap-1"
        >
          View all
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Activity list */}
      <div className="space-y-1 flex-1 overflow-auto">
        {activity.map((entry) => (
          <div
            key={entry.id}
            className={`flex gap-3 p-2.5 rounded-lg transition-colors hover:bg-muted ${SEVERITY_STYLE[entry.severity]}`}
          >
            {/* Actor icon */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                ACTOR_STYLE[entry.actorType]
              }`}
            >
              {ACTOR_ICON[entry.actorType]}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">
                <span className="font-medium">{entry.actor}</span>
                <span className="text-muted-foreground"> {entry.action}</span>
              </p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{entry.target}</p>
            </div>

            {/* Timestamp */}
            <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
              {timeAgo(entry.timestamp)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
