'use client';

import Link from 'next/link';
import {
  UserPlus,
  Bell,
  FileText,
  Activity,
  Settings,
  DatabaseZap,
  Bus,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';

const ACTIONS = [
  {
    icon: UserPlus,
    label: 'Add User',
    description: 'Create MOT officer or admin',
    href: '/admin/users/create',
    color: 'blue',
  },
  {
    icon: Bell,
    label: 'Notify Users',
    description: 'Broadcast alert or update',
    href: '/admin/notifications/compose',
    color: 'green',
  },
  {
    icon: Activity,
    label: 'Monitoring',
    description: 'System health & performance',
    href: '/admin/monitoring',
    color: 'teal',
  },
  {
    icon: FileText,
    label: 'System Logs',
    description: 'Browse audit & error logs',
    href: '/admin/logs',
    color: 'purple',
  },
  {
    icon: ShieldCheck,
    label: 'Security Logs',
    description: 'Auth & security events',
    href: '/admin/logs/listing?tab=security',
    color: 'orange',
  },
  {
    icon: Settings,
    label: 'Settings',
    description: 'Configure system options',
    href: '/admin/settings',
    color: 'gray',
  },
] as const;

const ICON_STYLES: Record<string, string> = {
  blue:   'bg-blue-100 text-blue-600',
  green:  'bg-green-100 text-green-600',
  teal:   'bg-teal-100 text-teal-600',
  purple: 'bg-purple-100 text-purple-600',
  orange: 'bg-orange-100 text-orange-600',
  gray:   'bg-gray-100 text-gray-600',
};

export function DashboardQuickActions() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
      {/* Header */}
      <h3 className="font-semibold text-gray-900 text-sm">Quick Actions</h3>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-2">
        {ACTIONS.map(({ icon: Icon, label, description, href, color }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col gap-2 p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all duration-150"
          >
            <div className="flex items-center justify-between">
              <div className={`p-1.5 rounded-md ${ICON_STYLES[color]}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <ArrowUpRight className="h-3 w-3 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-900">{label}</p>
              <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
