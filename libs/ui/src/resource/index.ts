/**
 * Resource layer — declarative CRUD-screen generator built on top of the
 * existing @busmate/ui patterns (DataTable, FilterBar, StatsCardGrid, ConfirmDialog).
 *
 * See docs/ui/10-scalable-ui-development-approach.md for the design and rollout plan.
 *
 * Usage:
 *   const busesResource = defineResource<BusResponse, BusFilters>({ ... });
 *   <ResourceListView resource={busesResource} navigate={router.push} />
 *
 * Drop to the individual blocks (ResourceStats/ResourceFilters/ResourceTable)
 * or straight to @busmate/ui patterns for anything the config can't express.
 */

export { defineResource } from "./define-resource";
export { useResource } from "./use-resource";
export { ResourceStats } from "./blocks/resource-stats";
export { ResourceFilters } from "./blocks/resource-filters";
export { ResourceTable } from "./blocks/resource-table";
export { ResourceListView } from "./views/resource-list-view";

export type {
  ResourceConfig,
  ResourceController,
  ResourceListQuery,
  ResourcePage,
  StatItem,
  FilterFieldDef,
  ResourceMessages,
} from "./types";
