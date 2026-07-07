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
  '#3b82f6': 'bg-primary/10 text-primary border-primary/10',
  '#14b8a6': 'bg-primary/10 text-teal-600 border-teal-100',
  '#a855f7': 'bg-[hsl(var(--purple-50))] text-[hsl(var(--purple-600))] border-purple-100',
  '#f59e0b': 'bg-warning/10 text-warning border-warning/10',
};

interface OperatorDashboardStaffStatusProps {
  staffStatus: StaffStatusItem[];
  loading?: boolean;
}

export function OperatorDashboardStaffStatus({ staffStatus, loading = false }: OperatorDashboardStaffStatusProps) {
  if (loading || staffStatus.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 animate-pulse">
        <div className="h-5 w-28 bg-muted rounded mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-lg" />
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
    <div className="bg-card rounded-xl border border-border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Staff Status</h3>
        <Link
          href="/operator/staff"
          className="text-xs text-primary hover:text-primary flex items-center gap-1"
        >
          Manage
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Utilization bar */}
      {total && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-muted-foreground">{onDutyCount} on duty of {total.value} total</span>
            <span className="text-xs font-semibold text-foreground">{onDutyPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-success transition-all duration-500"
              style={{ width: `${onDutyPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3">
        {staffStatus.map((item) => {
          const style = BG[item.color] ?? 'bg-muted text-muted-foreground border-border';
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
