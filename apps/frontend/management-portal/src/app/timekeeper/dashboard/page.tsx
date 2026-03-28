'use client';

import {
  RealTimeClock,
  StatsCards,
  UpcomingDepartures,
  AssignedStopInfo,
} from '@/components/timekeeper/dashboard';
import { useTKDashboard } from '@/hooks/timekeeper/dashboard/useTKDashboard';

export default function TimeKeeperDashboardPage() {
  const { stats, departures, assignedStop, isLoading } = useTKDashboard();

  if (isLoading || !stats || !assignedStop) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StatsCards stats={stats} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <RealTimeClock />
          <AssignedStopInfo stop={assignedStop} busesAtStop={stats.busesAtStop} />
        </div>
        <div className="lg:col-span-2">
          <UpcomingDepartures departures={departures} title="Upcoming Departures" />
        </div>
      </div>
    </div>
  );
}
