'use client';

import {
  Bus,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { StatsCard, StatsCardGrid } from '@busmate/ui';
import { TripStats } from '@/data/timekeeper/types';

interface TripStatsCardsProps {
  stats: TripStats;
  className?: string;
}

export function TripStatsCards({ stats, className }: TripStatsCardsProps) {
  return (
    <StatsCardGrid className={`lg:grid-cols-6 ${className ?? ''}`}>
      <StatsCard
        title="Total Trips"
        value={stats.totalTrips}
        icon={<Calendar className="h-5 w-5" />}
      />
      <StatsCard
        title="Scheduled"
        value={stats.scheduledTrips}
        icon={<Clock className="h-5 w-5" />}
      />
      <StatsCard
        title="In Progress"
        value={stats.inProgressTrips}
        icon={<Bus className="h-5 w-5" />}
      />
      <StatsCard
        title="Completed"
        value={stats.completedTrips}
        icon={<CheckCircle className="h-5 w-5" />}
      />
      <StatsCard
        title="Delayed"
        value={stats.delayedTrips}
        icon={<AlertTriangle className="h-5 w-5" />}
      />
      <StatsCard
        title="Cancelled"
        value={stats.cancelledTrips}
        icon={<XCircle className="h-5 w-5" />}
      />
    </StatsCardGrid>
  );
}
