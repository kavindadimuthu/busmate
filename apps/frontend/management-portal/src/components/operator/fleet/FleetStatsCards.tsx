import * as React from "react";
import { Bus, CheckCircle, XCircle, Wrench, Gauge, Users } from "lucide-react";
import { StatsCard, StatsCardGrid } from "@busmate/ui";
import type { FleetStatistics } from "@/data/operator/buses";

// ── Types ─────────────────────────────────────────────────────────

interface FleetStatsCardsProps {
  stats: FleetStatistics;
  loading?: boolean;
}

// ── Component ─────────────────────────────────────────────────────

/**
 * Fleet KPI stats cards.
 *
 * Composes `StatsCardGrid` + `StatsCard` from `@busmate/ui` with
 * fleet-specific metrics.
 */
export function FleetStatsCards({ stats, loading = false }: FleetStatsCardsProps) {
  if (loading) {
    return (
      <StatsCardGrid className="lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-xl border bg-card animate-pulse"
          />
        ))}
      </StatsCardGrid>
    );
  }

  return (
    <StatsCardGrid className="lg:grid-cols-6">
      <StatsCard
        title="Total Buses"
        value={stats.totalBuses.toLocaleString()}
        icon={<Bus className="h-5 w-5" />}
      />
      <StatsCard
        title="Active"
        value={stats.activeBuses.toLocaleString()}
        icon={<CheckCircle className="h-5 w-5" />}
      />
      <StatsCard
        title="Inactive"
        value={stats.inactiveBuses.toLocaleString()}
        icon={<XCircle className="h-5 w-5" />}
      />
      <StatsCard
        title="Maintenance"
        value={stats.maintenanceBuses.toLocaleString()}
        icon={<Wrench className="h-5 w-5" />}
      />
      <StatsCard
        title="Avg. Capacity"
        value={`${Math.round(stats.averageCapacity)} seats`}
        icon={<Gauge className="h-5 w-5" />}
      />
      <StatsCard
        title="Total Seats"
        value={stats.totalCapacity.toLocaleString()}
        icon={<Users className="h-5 w-5" />}
      />
    </StatsCardGrid>
  );
}
