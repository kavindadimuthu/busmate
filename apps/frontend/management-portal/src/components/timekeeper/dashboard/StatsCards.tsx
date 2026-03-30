'use client';

import {
  Bus,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { StatsCard, StatsCardGrid } from '@busmate/ui';
import { DashboardStats } from '@/data/timekeeper/types';

interface StatsCardsProps {
  stats: DashboardStats;
  className?: string;
}

export function StatsCards({ stats, className }: StatsCardsProps) {
  return (
    <StatsCardGrid className={className}>
      <StatsCard
        title="Total Trips Today"
        value={stats.totalTripsToday}
        icon={<Bus className="h-5 w-5" />}
        trend={{ value: 5, direction: 'up' }}
      />
      <StatsCard
        title="Completed"
        value={stats.completedTrips}
        icon={<CheckCircle className="h-5 w-5" />}
        description={`${stats.activeTrips} active, ${stats.pendingTrips} pending`}
      />
      <StatsCard
        title="On-Time Rate"
        value={`${stats.onTimePercentage}%`}
        icon={<Clock className="h-5 w-5" />}
        description="Performance metric"
        trend={{ value: 2.1, direction: 'up' }}
      />
      <StatsCard
        title="Delayed / Cancelled"
        value={`${stats.delayedTrips} / ${stats.cancelledTrips}`}
        icon={<AlertTriangle className="h-5 w-5" />}
        description="Requires attention"
      />
    </StatsCardGrid>
  );
}
