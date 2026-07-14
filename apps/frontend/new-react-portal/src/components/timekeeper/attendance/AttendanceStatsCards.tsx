'use client';

import {
  Users,
  UserCheck,
  UserX,
  Clock,
  CalendarOff,
} from 'lucide-react';
import { StatsCard, StatsCardGrid } from '@busmate/ui';
import { AttendanceStats } from '@/data/timekeeper/types';

interface AttendanceStatsCardsProps {
  stats: AttendanceStats;
  className?: string;
}

export function AttendanceStatsCards({ stats, className }: AttendanceStatsCardsProps) {
  return (
    <StatsCardGrid className={`lg:grid-cols-5 ${className ?? ''}`}>
      <StatsCard
        title="Total Staff"
        value={stats.totalStaff}
        icon={<Users className="h-5 w-5" />}
      />
      <StatsCard
        title="Present"
        value={stats.presentCount}
        icon={<UserCheck className="h-5 w-5" />}
      />
      <StatsCard
        title="Late"
        value={stats.lateCount}
        icon={<Clock className="h-5 w-5" />}
      />
      <StatsCard
        title="Absent"
        value={stats.absentCount}
        icon={<UserX className="h-5 w-5" />}
      />
      <StatsCard
        title="On Leave"
        value={stats.onLeaveCount}
        icon={<CalendarOff className="h-5 w-5" />}
      />
    </StatsCardGrid>
  );
}
