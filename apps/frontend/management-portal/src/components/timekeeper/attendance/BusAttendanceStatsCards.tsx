'use client';

import {
  Bus,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { StatsCard, StatsCardGrid } from '@busmate/ui';
import { BusAttendanceStats } from '@/data/timekeeper/types';

interface BusAttendanceStatsCardsProps {
  stats: BusAttendanceStats;
  className?: string;
}

export function BusAttendanceStatsCards({ stats, className }: BusAttendanceStatsCardsProps) {
  return (
    <StatsCardGrid className={`lg:grid-cols-5 ${className ?? ''}`}>
      <StatsCard
        title="Total Buses"
        value={stats.totalBusesToday}
        icon={<Bus className="h-5 w-5" />}
      />
      <StatsCard
        title="On Time"
        value={stats.arrivedOnTime}
        icon={<CheckCircle className="h-5 w-5" />}
      />
      <StatsCard
        title="Delayed"
        value={stats.delayed}
        icon={<Clock className="h-5 w-5" />}
      />
      <StatsCard
        title="Missed"
        value={stats.missed}
        icon={<XCircle className="h-5 w-5" />}
      />
      <StatsCard
        title="Expected"
        value={stats.expectedToday}
        icon={<AlertTriangle className="h-5 w-5" />}
      />
    </StatsCardGrid>
  );
}
