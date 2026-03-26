import * as React from "react";
import {
  Route,
  Navigation,
  Ruler,
  Users,
  Clock,
} from "lucide-react";
import { StatsCard, StatsCardGrid } from "@busmate/ui";

interface RouteStats {
  totalRoutes: { count: number };
  outboundRoutes: { count: number };
  inboundRoutes: { count: number };
  averageDistance: { count: number; unit: string };
  totalRouteGroups: { count: number };
  averageDuration: { count: number; unit: string };
}

interface RoutesStatsCardsProps {
  stats: RouteStats;
}

export function RoutesStatsCards({ stats }: RoutesStatsCardsProps) {
  return (
    <StatsCardGrid className="lg:grid-cols-6">
      <StatsCard
        title="Total Routes"
        value={stats.totalRoutes.count.toLocaleString()}
        icon={<Route className="h-5 w-5" />}
      />
      <StatsCard
        title="Outbound"
        value={stats.outboundRoutes.count.toLocaleString()}
        icon={<Navigation className="h-5 w-5" />}
      />
      <StatsCard
        title="Inbound"
        value={stats.inboundRoutes.count.toLocaleString()}
        icon={<Navigation className="h-5 w-5 rotate-180" />}
      />
      <StatsCard
        title="Avg Distance"
        value={`${stats.averageDistance.count.toFixed(1)} ${stats.averageDistance.unit}`}
        icon={<Ruler className="h-5 w-5" />}
      />
      <StatsCard
        title="Route Groups"
        value={stats.totalRouteGroups.count.toLocaleString()}
        icon={<Users className="h-5 w-5" />}
      />
      <StatsCard
        title="Avg Duration"
        value={`${stats.averageDuration.count.toFixed(0)} ${stats.averageDuration.unit}`}
        icon={<Clock className="h-5 w-5" />}
      />
    </StatsCardGrid>
  );
}
