import * as React from "react";
import { Building, CheckCircle, XCircle, MapPin, Users, Clock } from "lucide-react";
import { StatsCard, StatsCardGrid } from "@busmate/ui";

// ── Types ─────────────────────────────────────────────────────────

interface OperatorStats {
  totalOperators: { count: number };
  activeOperators: { count: number };
  inactiveOperators: { count: number };
  privateOperators: { count: number };
  ctbOperators: { count: number };
  totalRegions: { count: number };
}

interface OperatorsStatsCardsProps {
  stats: OperatorStats;
}

// ── Component ─────────────────────────────────────────────────────

/**
 * Operators KPI stats cards.
 *
 * Composes `StatsCardGrid` + `StatsCard` from `@busmate/ui` with
 * operator-specific metrics.
 */
export function OperatorsStatsCards({ stats }: OperatorsStatsCardsProps) {
  return (
    <StatsCardGrid className="lg:grid-cols-6">
      <StatsCard
        title="Total Operators"
        value={stats.totalOperators.count.toLocaleString()}
        icon={<Building className="h-5 w-5" />}
      />
      <StatsCard
        title="Active"
        value={stats.activeOperators.count.toLocaleString()}
        icon={<CheckCircle className="h-5 w-5" />}
      />
      <StatsCard
        title="Inactive"
        value={stats.inactiveOperators.count.toLocaleString()}
        icon={<XCircle className="h-5 w-5" />}
      />
      <StatsCard
        title="Private"
        value={stats.privateOperators.count.toLocaleString()}
        icon={<Building className="h-5 w-5" />}
      />
      <StatsCard
        title="CTB"
        value={stats.ctbOperators.count.toLocaleString()}
        icon={<Users className="h-5 w-5" />}
      />
      <StatsCard
        title="Regions Covered"
        value={stats.totalRegions.count.toLocaleString()}
        icon={<MapPin className="h-5 w-5" />}
      />
    </StatsCardGrid>
  );
}
