import * as React from "react";
import { Users, CheckCircle, XCircle, Clock, Search, MapPin } from "lucide-react";
import { StatsCard, StatsCardGrid } from "@busmate/ui";

interface StaffStats {
  totalStaff: { count: number };
  activeStaff: { count: number };
  inactiveStaff: { count: number };
  totalTimekeepers: { count: number };
  totalInspectors: { count: number };
  provincesCount: { count: number };
}

interface StaffStatsCardsProps {
  stats: StaffStats;
}

export function StaffStatsCards({ stats }: StaffStatsCardsProps) {
  return (
    <StatsCardGrid className="lg:grid-cols-6">
      <StatsCard
        title="Total Staff"
        value={stats.totalStaff.count.toLocaleString()}
        icon={<Users className="h-5 w-5" />}
      />
      <StatsCard
        title="Active"
        value={stats.activeStaff.count.toLocaleString()}
        icon={<CheckCircle className="h-5 w-5" />}
      />
      <StatsCard
        title="Inactive"
        value={stats.inactiveStaff.count.toLocaleString()}
        icon={<XCircle className="h-5 w-5" />}
      />
      <StatsCard
        title="Timekeepers"
        value={stats.totalTimekeepers.count.toLocaleString()}
        icon={<Clock className="h-5 w-5" />}
      />
      <StatsCard
        title="Inspectors"
        value={stats.totalInspectors.count.toLocaleString()}
        icon={<Search className="h-5 w-5" />}
      />
      <StatsCard
        title="Provinces"
        value={stats.provincesCount.count.toLocaleString()}
        icon={<MapPin className="h-5 w-5" />}
      />
    </StatsCardGrid>
  );
}
