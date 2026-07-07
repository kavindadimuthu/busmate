'use client';

import {
  Calendar,
  CheckCircle,
  XCircle,
  Navigation,
  AlertTriangle,
} from 'lucide-react';
import { StatsCard, StatsCardGrid } from '@busmate/ui';
import type { OperatorTripStatistics } from '@/data/operator/trips';

interface OperatorTripStatsCardsProps {
  stats: OperatorTripStatistics | null;
  loading?: boolean;
}

export function OperatorTripStatsCards({ stats, loading = false }: OperatorTripStatsCardsProps) {
  const safeStats: OperatorTripStatistics = stats ?? {
    totalTrips: 0,
    activeTrips: 0,
    pendingTrips: 0,
    completedTrips: 0,
    cancelledTrips: 0,
    delayedTrips: 0,
    inTransitTrips: 0,
    todaysTrips: 0,
  };

  if (loading) {
    return (
      <StatsCardGrid className="lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border bg-card animate-pulse" />
        ))}
      </StatsCardGrid>
    );
  }

  return (
    <StatsCardGrid className="lg:grid-cols-6">
      <StatsCard
        title="In Transit"
        value={safeStats.inTransitTrips.toLocaleString()}
        icon={<Navigation className="h-5 w-5" />}
      />
      <StatsCard
        title="Active"
        value={safeStats.activeTrips.toLocaleString()}
        icon={<CheckCircle className="h-5 w-5" />}
      />
      <StatsCard
        title="Delayed"
        value={safeStats.delayedTrips.toLocaleString()}
        icon={<AlertTriangle className="h-5 w-5" />}
      />
      <StatsCard
        title="Completed"
        value={safeStats.completedTrips.toLocaleString()}
        icon={<CheckCircle className="h-5 w-5" />}
      />
      <StatsCard
        title="Cancelled"
        value={safeStats.cancelledTrips.toLocaleString()}
        icon={<XCircle className="h-5 w-5" />}
      />
      <StatsCard
        title="Total Trips"
        value={safeStats.totalTrips.toLocaleString()}
        icon={<Calendar className="h-5 w-5" />}
      />
    </StatsCardGrid>
  );
}
