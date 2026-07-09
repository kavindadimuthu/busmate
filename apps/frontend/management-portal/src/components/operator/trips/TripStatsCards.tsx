import * as React from "react";
import { Calendar, CheckCircle, XCircle, Clock, AlertTriangle, Navigation } from "lucide-react";
import { StatsCard, StatsCardGrid } from "@busmate/ui";
import type { TripStatistics } from "@/hooks/operator/trips/useTripsManagement";

interface TripStatsCardsProps {
  stats: TripStatistics;
  loading?: boolean;
}

/**
 * Trip KPI stats cards - computed client-side from the operator's real trips
 * (core-service has no operator-scoped trip-statistics endpoint).
 */
export function TripStatsCards({ stats, loading = false }: TripStatsCardsProps) {
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
      <StatsCard title="Total Trips" value={stats.totalTrips.toLocaleString()} icon={<Calendar className="h-5 w-5" />} />
      <StatsCard title="Pending" value={stats.pendingTrips.toLocaleString()} icon={<Clock className="h-5 w-5" />} />
      <StatsCard title="In Transit" value={stats.inTransitTrips.toLocaleString()} icon={<Navigation className="h-5 w-5" />} />
      <StatsCard title="Completed" value={stats.completedTrips.toLocaleString()} icon={<CheckCircle className="h-5 w-5" />} />
      <StatsCard title="Delayed" value={stats.delayedTrips.toLocaleString()} icon={<AlertTriangle className="h-5 w-5" />} />
      <StatsCard title="Cancelled" value={stats.cancelledTrips.toLocaleString()} icon={<XCircle className="h-5 w-5" />} />
    </StatsCardGrid>
  );
}
