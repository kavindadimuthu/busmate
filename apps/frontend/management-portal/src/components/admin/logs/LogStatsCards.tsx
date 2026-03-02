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
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 animate-pulse"
          >
            <div className="flex items-center">
              <div className="w-11 h-11 bg-gray-200 rounded-lg" />
              <div className="ml-3 flex-1">
                <div className="h-6 bg-gray-200 rounded w-12 mb-1.5" />
                <div className="h-3.5 bg-gray-100 rounded w-20" />
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
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-600',
    },
    {
      label: 'User Activities',
      value: stats.totalUserActivities,
      icon: Users,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      textColor: 'text-green-600',
    },
    {
      label: 'Security Events',
      value: stats.totalSecurityEvents,
      icon: Shield,
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      textColor: 'text-orange-600',
    },
    {
      label: 'Application Logs',
      value: stats.totalApplicationLogs,
      icon: Code,
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      textColor: 'text-purple-600',
    },
    {
      label: 'Errors',
      value: stats.errorLogs + stats.failedActions,
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      textColor: 'text-red-600',
    },
    {
      label: 'Blocked Threats',
      value: stats.blockedThreats,
      icon: AlertTriangle,
      bgColor: 'bg-teal-50',
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
              <p className="text-2xl font-bold text-gray-900">{card.value.toLocaleString()}</p>
              <p className="text-xs font-medium text-gray-500">{card.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
