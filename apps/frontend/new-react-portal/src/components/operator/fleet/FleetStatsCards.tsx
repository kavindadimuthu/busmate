import * as React from "react";
import { Bus, CheckCircle, XCircle, Clock, Gauge, Users } from "lucide-react";
import { StatsCard, StatsCardGrid } from "@busmate/ui";
import type { FleetStatistics } from "@/hooks/operator/fleet/useFleetManagement";

// ── Types ─────────────────────────────────────────────────────────

interface FleetStatsCardsProps {
  stats: FleetStatistics;
  loading?: boolean;
}

// ── Component ─────────────────────────────────────────────────────

/**
 * Fleet KPI stats cards — computed from the operator's real buses
 * (see useFleetManagement.loadStatistics; core-service has no dedicated
 * operator-scoped stats endpoint yet).
 */
export function FleetStatsCards({ stats, loading = false }: FleetStatsCardsProps) {
  if (loading) {
    return (
      <StatsCardGrid className="lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-xl border bg-card animate-pulse"
          />
        ))}
      </StatsCardGrid>
    );
  }

  return (
    <StatsCardGrid className="lg:grid-cols-5">
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
        title="Pending"
        value={stats.pendingBuses.toLocaleString()}
        icon={<Clock className="h-5 w-5" />}
      />
      <StatsCard
        title="Avg. Capacity"
        value={`${stats.averageCapacity} seats`}
        icon={<Gauge className="h-5 w-5" />}
      />
    </StatsCardGrid>
  );
}
