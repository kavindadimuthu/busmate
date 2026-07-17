import * as React from "react";
import { StatsCard, StatsCardGrid } from "../../patterns/stats-card";
import type { ResourceConfig, ResourceController } from "../types";

export interface ResourceStatsProps<TRow, TFilters extends Record<string, any>> {
  resource: ResourceConfig<TRow, TFilters>;
  controller: Pick<ResourceController<TRow, TFilters>, "stats">;
  className?: string;
}

/** L2 block: renders `controller.stats` as a StatsCardGrid. Returns null if the resource has no stats API. */
export function ResourceStats<TRow, TFilters extends Record<string, any>>({
  resource,
  controller,
  className,
}: ResourceStatsProps<TRow, TFilters>) {
  if (!resource.api.stats || controller.stats.length === 0) return null;

  return (
    <StatsCardGrid className={className}>
      {controller.stats.map((s) => (
        <StatsCard key={s.label} title={s.label} value={s.value} icon={s.icon} />
      ))}
    </StatsCardGrid>
  );
}
