"use client";

import * as React from "react";
import {
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  XCircle,
} from "lucide-react";
import { StatsCard, StatsCardGrid } from "@busmate/ui";

interface TripStats {
  totalTrips: { count: number };
  activeTrips: { count: number };
  completedTrips: { count: number };
  pendingTrips: { count: number };
  cancelledTrips: { count: number };
  inTransitTrips: { count: number };
}

interface TripsStatsCardsNewProps {
  stats: TripStats;
}

export function TripsStatsCardsNew({ stats }: TripsStatsCardsNewProps) {
  return (
    <StatsCardGrid className="lg:grid-cols-6">
      <StatsCard title="Total Trips" value={stats.totalTrips.count.toLocaleString()} icon={<Calendar className="h-5 w-5" />} />
      <StatsCard title="Active" value={stats.activeTrips.count.toLocaleString()} icon={<CheckCircle className="h-5 w-5" />} />
      <StatsCard title="Completed" value={stats.completedTrips.count.toLocaleString()} icon={<CheckCircle className="h-5 w-5" />} />
      <StatsCard title="Pending" value={stats.pendingTrips.count.toLocaleString()} icon={<Clock className="h-5 w-5" />} />
      <StatsCard title="In Transit" value={stats.inTransitTrips.count.toLocaleString()} icon={<MapPin className="h-5 w-5" />} />
      <StatsCard title="Cancelled" value={stats.cancelledTrips.count.toLocaleString()} icon={<XCircle className="h-5 w-5" />} />
    </StatsCardGrid>
  );
}
