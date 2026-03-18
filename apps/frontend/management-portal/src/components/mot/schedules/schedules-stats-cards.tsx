"use client";

import * as React from "react";
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Route,
} from "lucide-react";
import { StatsCard, StatsCardGrid } from "@busmate/ui";

interface ScheduleStats {
  totalSchedules: { count: number };
  activeSchedules: { count: number };
  inactiveSchedules: { count: number };
  regularSchedules: { count: number };
  specialSchedules: { count: number };
  totalRoutes: { count: number };
}

interface SchedulesStatsCardsNewProps {
  stats: ScheduleStats;
}

export function SchedulesStatsCardsNew({ stats }: SchedulesStatsCardsNewProps) {
  return (
    <StatsCardGrid className="lg:grid-cols-6">
      <StatsCard title="Total Schedules" value={stats.totalSchedules.count.toLocaleString()} icon={<Calendar className="h-5 w-5" />} />
      <StatsCard title="Active" value={stats.activeSchedules.count.toLocaleString()} icon={<CheckCircle className="h-5 w-5" />} />
      <StatsCard title="Inactive" value={stats.inactiveSchedules.count.toLocaleString()} icon={<XCircle className="h-5 w-5" />} />
      <StatsCard title="Regular" value={stats.regularSchedules.count.toLocaleString()} icon={<Clock className="h-5 w-5" />} />
      <StatsCard title="Special" value={stats.specialSchedules.count.toLocaleString()} icon={<Zap className="h-5 w-5" />} />
      <StatsCard title="Routes Covered" value={stats.totalRoutes.count.toLocaleString()} icon={<Route className="h-5 w-5" />} />
    </StatsCardGrid>
  );
}
