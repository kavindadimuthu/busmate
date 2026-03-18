'use client';

import Link from 'next/link';
import { Bus, Calendar, Users, Route, Wrench, Activity, ArrowUpRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { QuickAction } from '@/data/operator/dashboard';

const ICON_MAP: Record<string, LucideIcon> = {
  bus:      Bus,
  calendar: Calendar,
  users:    Users,
  route:    Route,
  wrench:   Wrench,
  activity: Activity,
};

const ICON_STYLES: Record<QuickAction['color'], string> = {
  blue:   'bg-blue-100 text-blue-600',
  green:  'bg-green-100 text-green-600',
  purple: 'bg-purple-100 text-purple-600',
  orange: 'bg-orange-100 text-orange-600',
  red:    'bg-red-100 text-red-600',
  teal:   'bg-teal-100 text-teal-600',
};

interface OperatorDashboardQuickActionsProps {
  actions: QuickAction[];
  loading?: boolean;
}

export function OperatorDashboardQuickActions({ actions, loading = false }: OperatorDashboardQuickActionsProps) {
  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 flex flex-col gap-4">
        <div className="h-5 w-28 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6 flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>

      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => {
          const IconComponent = ICON_MAP[action.icon] || Activity;
          return (
            <Link
              key={action.id}
              href={action.href}
              className="group flex flex-col gap-2 p-3 rounded-lg border border-border bg-muted hover:bg-card hover:border-border hover:shadow-sm transition-all duration-150"
            >
              <div className="flex items-center justify-between">
                <div className={`p-1.5 rounded-md ${ICON_STYLES[action.color]}`}>
                  <IconComponent className="h-3.5 w-3.5" />
                </div>
                <ArrowUpRight className="h-3 w-3 text-muted-foreground group-hover:text-muted-foreground transition-colors" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">{action.label}</p>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{action.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
