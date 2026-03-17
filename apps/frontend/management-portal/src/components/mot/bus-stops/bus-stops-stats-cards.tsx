import * as React from "react";
import { MapPin, Accessibility, AlertCircle, Map, Building2 } from "lucide-react";
import { StatsCard, StatsCardGrid } from "@busmate/ui";

// ── Types ─────────────────────────────────────────────────────────

interface BusStopStats {
  totalStops: { count: number };
  accessibleStops: { count: number };
  nonAccessibleStops: { count: number };
  totalStates: { count: number };
  totalCities: { count: number };
}

interface BusStopsStatsCardsProps {
  stats: BusStopStats;
}

// ── Component ─────────────────────────────────────────────────────

/**
 * Bus-stop KPI stats cards.
 *
 * Composes `StatsCardGrid` + `StatsCard` from `@busmate/ui` with
 * bus-stop-specific metrics.
 */
export function BusStopsStatsCards({ stats }: BusStopsStatsCardsProps) {
  return (
    <StatsCardGrid className="lg:grid-cols-5">
      <StatsCard
        title="Total Bus Stops"
        value={stats.totalStops.count.toLocaleString()}
        icon={<MapPin className="h-5 w-5" />}
      />
      <StatsCard
        title="Accessible"
        value={stats.accessibleStops.count.toLocaleString()}
        icon={<Accessibility className="h-5 w-5" />}
      />
      <StatsCard
        title="Not Accessible"
        value={stats.nonAccessibleStops.count.toLocaleString()}
        icon={<AlertCircle className="h-5 w-5" />}
      />
      <StatsCard
        title="States"
        value={stats.totalStates.count.toLocaleString()}
        icon={<Map className="h-5 w-5" />}
      />
      <StatsCard
        title="Cities"
        value={stats.totalCities.count.toLocaleString()}
        icon={<Building2 className="h-5 w-5" />}
      />
    </StatsCardGrid>
  );
}
