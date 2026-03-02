'use client';

import Link from 'next/link';
import { Route, Bus, Users, Shield, Calendar, Activity, ArrowUpRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { QuickAction } from '@/data/mot/dashboard';

const ICON_MAP: Record<string, LucideIcon> = {
  route: Route,
  bus: Bus,
  users: Users,
  shield: Shield,
  calendar: Calendar,
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

interface MOTDashboardQuickActionsProps {
  actions: QuickAction[];
  loading?: boolean;
}

export function MOTDashboardQuickActions({ actions, loading = false }: MOTDashboardQuickActionsProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
        <div className="h-5 w-28 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
      {/* Header */}
      <h3 className="font-semibold text-gray-900 text-sm">Quick Actions</h3>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => {
          const IconComponent = ICON_MAP[action.icon] || Activity;
          const iconStyle = ICON_STYLES[action.color];

          return (
            <Link
              key={action.id}
              href={action.href}
              className="group flex flex-col gap-2 p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all duration-150"
            >
              <div className="flex items-center justify-between">
                <div className={`p-1.5 rounded-md ${iconStyle}`}>
                  <IconComponent className="h-3.5 w-3.5" />
                </div>
                <ArrowUpRight className="h-3 w-3 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900">{action.label}</p>
                <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{action.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
