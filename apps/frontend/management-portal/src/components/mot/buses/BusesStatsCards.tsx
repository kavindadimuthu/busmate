import * as React from "react";
import { Bus, CheckCircle, XCircle, Users, Gauge, MapPin } from "lucide-react";
import { StatsCard, StatsCardGrid } from "@busmate/ui";

interface BusStats {
  totalBuses: { count: number };
  activeBuses: { count: number };
  inactiveBuses: { count: number };
  totalOperators: { count: number };
  averageCapacity: { count: number };
  totalCapacity: { count: number };
}

interface BusesStatsCardsProps {
  stats: BusStats;
}

export function BusesStatsCards({ stats }: BusesStatsCardsProps) {
  return (
    <StatsCardGrid className="lg:grid-cols-6">
      <StatsCard
        title="Total Buses"
        value={stats.totalBuses.count.toLocaleString()}
        icon={<Bus className="h-5 w-5" />}
      />
      <StatsCard
        title="Active"
        value={stats.activeBuses.count.toLocaleString()}
        icon={<CheckCircle className="h-5 w-5" />}
      />
      <StatsCard
        title="Inactive"
        value={stats.inactiveBuses.count.toLocaleString()}
        icon={<XCircle className="h-5 w-5" />}
      />
      <StatsCard
        title="Operators"
        value={stats.totalOperators.count.toLocaleString()}
        icon={<Users className="h-5 w-5" />}
      />
      <StatsCard
        title="Avg Capacity"
        value={Math.round(stats.averageCapacity.count).toString()}
        icon={<Gauge className="h-5 w-5" />}
      />
      <StatsCard
        title="Total Capacity"
        value={stats.totalCapacity.count.toLocaleString()}
        icon={<MapPin className="h-5 w-5" />}
      />
    </StatsCardGrid>
  );
}
