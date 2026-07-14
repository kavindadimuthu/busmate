import * as React from "react";
import { Users, CheckCircle, XCircle, Clock } from "lucide-react";
import { StatsCard, StatsCardGrid } from "@busmate/ui";

interface CrewStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
}

interface CrewStatsCardsProps {
  stats: CrewStats;
  loading?: boolean;
}

export function CrewStatsCards({ stats, loading = false }: CrewStatsCardsProps) {
  if (loading) {
    return (
      <StatsCardGrid className="lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border bg-card animate-pulse" />
        ))}
      </StatsCardGrid>
    );
  }

  return (
    <StatsCardGrid className="lg:grid-cols-4">
      <StatsCard title="Total Conductors" value={stats.total.toLocaleString()} icon={<Users className="h-5 w-5" />} />
      <StatsCard title="Active" value={stats.active.toLocaleString()} icon={<CheckCircle className="h-5 w-5" />} />
      <StatsCard title="Inactive" value={stats.inactive.toLocaleString()} icon={<XCircle className="h-5 w-5" />} />
      <StatsCard title="Pending" value={stats.pending.toLocaleString()} icon={<Clock className="h-5 w-5" />} />
    </StatsCardGrid>
  );
}
