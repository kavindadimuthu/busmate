'use client';

import { Car, Users, UserCheck, CalendarOff, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { StaffStatusItem } from '@/data/operator/dashboard';

const ICON_MAP: Record<StaffStatusItem['icon'], React.ReactNode> = {
  total:     <Users className="h-5 w-5" />,
  driver:    <Car className="h-5 w-5" />,
  conductor: <UserCheck className="h-5 w-5" />,
  leave:     <CalendarOff className="h-5 w-5" />,
};

const BG: Record<string, string> = {
  '#3b82f6': 'bg-blue-50 text-blue-600 border-blue-100',
  '#14b8a6': 'bg-teal-50 text-teal-600 border-teal-100',
  '#a855f7': 'bg-purple-50 text-purple-600 border-purple-100',
  '#f59e0b': 'bg-amber-50 text-amber-600 border-amber-100',
};

interface OperatorDashboardStaffStatusProps {
  staffStatus: StaffStatusItem[];
  loading?: boolean;
}

export function OperatorDashboardStaffStatus({ staffStatus, loading = false }: OperatorDashboardStaffStatusProps) {
  if (loading || staffStatus.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="h-5 w-28 bg-gray-200 rounded mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const total = staffStatus.find((s) => s.icon === 'total');
  const onDuty = staffStatus.filter((s) => s.icon !== 'total' && s.icon !== 'leave');
  const onLeave = staffStatus.find((s) => s.icon === 'leave');

  const onDutyCount = onDuty.reduce((sum, s) => sum + s.value, 0);
  const onDutyPct = total ? Math.round((onDutyCount / total.value) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Staff Status</h3>
        <Link
          href="/operator/staff-management"
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          Manage
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Utilization bar */}
      {total && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-500">{onDutyCount} on duty of {total.value} total</span>
            <span className="text-xs font-semibold text-gray-900">{onDutyPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-500"
              style={{ width: `${onDutyPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3">
        {staffStatus.map((item) => {
          const style = BG[item.color] ?? 'bg-gray-50 text-gray-600 border-gray-100';
          return (
            <div key={item.label} className={`flex flex-col gap-2 p-3 rounded-lg border ${style}`}>
              <div className="opacity-70">{ICON_MAP[item.icon]}</div>
              <div>
                <p className="text-xl font-bold">{item.value}</p>
                <p className="text-[10px] font-medium opacity-80">{item.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
