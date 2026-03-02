'use client';

import Link from 'next/link';
import { Activity, ArrowUpRight, ShieldAlert, User, DollarSign, Cpu } from 'lucide-react';
import { ActivityEntry } from '@/data/admin/dashboard-v2';

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
  user:        'bg-blue-100 text-blue-600',
  system:      'bg-gray-100 text-gray-600',
  security:    'bg-orange-100 text-orange-600',
  transaction: 'bg-purple-100 text-purple-600',
};

const SEVERITY_STYLE: Record<ActivityEntry['severity'], string> = {
  normal:   '',
  warning:  'bg-amber-50 border-l-2 border-l-amber-400',
  critical: 'bg-red-50 border-l-2 border-l-red-500',
};

interface DashboardActivityFeedProps {
  activity: ActivityEntry[];
  loading?: boolean;
}

export function DashboardActivityFeed({ activity, loading = false }: DashboardActivityFeedProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-36 mb-5" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-3 mb-4">
            <div className="w-7 h-7 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-gray-600" />
          <h3 className="font-semibold text-gray-900 text-sm">Recent Activity</h3>
        </div>
        <Link
          href="/admin/logs"
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          View logs <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-3.5 top-0 bottom-0 w-px bg-gray-100" aria-hidden />

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
                <p className="text-xs text-gray-900 leading-snug">
                  <span className="font-semibold">{entry.actor}</span>
                  {' '}
                  <span className="text-gray-600">{entry.action}</span>
                </p>
                <p className="text-[10px] text-gray-500 truncate mt-0.5">{entry.target}</p>
              </div>

              {/* Timestamp */}
              <span className="text-[10px] text-gray-400 shrink-0 mt-0.5">{timeAgo(entry.timestamp)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
