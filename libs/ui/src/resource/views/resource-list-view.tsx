import * as React from "react";
import { ConfirmDialog } from "../../patterns/dialogs";
import { useResource } from "../use-resource";
import { ResourceStats } from "../blocks/resource-stats";
import { ResourceFilters } from "../blocks/resource-filters";
import { ResourceTable } from "../blocks/resource-table";
import type { ColumnDef } from "../../patterns/data-table";
import type { ResourceConfig, ResourceController } from "../types";

export interface ResourceListViewProps<TRow, TFilters extends Record<string, any>> {
  resource: ResourceConfig<TRow, TFilters>;
  /**
   * Pre-built controller from `useResource(resource)`. Pass this when the page
   * itself needs the controller (e.g. to drive header action buttons via
   * `useSetPageActions`) — ResourceListView will render it instead of creating
   * its own, avoiding a duplicate fetch. Omit it for the common case where the
   * view owns its own data lifecycle end to end.
   */
  controller?: ResourceController<TRow, TFilters>;
  /** App router's push function, e.g. `useRouter().push` — passed to rowActions/routes */
  navigate?: (path: string) => void;
  /** Override the resource's default columns for this render */
  columns?: ColumnDef<TRow>[];
  /** Override the resource's default rowActions for this render */
  rowActions?: ResourceConfig<TRow, TFilters>["rowActions"];
  /** Extra content rendered next to the filter bar (e.g. a bespoke toggle) */
  toolbar?: React.ReactNode;
  statsClassName?: string;
  /** Escape hatch: fully replace the body (stats/filters/table) while still getting the delete dialog wiring */
  children?: (controller: ResourceController<TRow, TFilters>) => React.ReactNode;
}

/**
 * L3 screen: composes ResourceStats + ResourceFilters + ResourceTable + the
 * delete ConfirmDialog from a single ResourceConfig. This is the default
 * altitude for CRUD list screens — drop to the individual L2 blocks (or
 * further to raw @busmate/ui patterns) for anything it can't express.
 */
export function ResourceListView<TRow, TFilters extends Record<string, any>>(
  props: ResourceListViewProps<TRow, TFilters>
) {
  if (props.controller) {
    return <ResourceListViewBody {...props} controller={props.controller} />;
  }
  return <ResourceListViewAuto {...props} />;
}

function ResourceListViewAuto<TRow, TFilters extends Record<string, any>>(
  props: ResourceListViewProps<TRow, TFilters>
) {
  const controller = useResource(props.resource);
  return <ResourceListViewBody {...props} controller={controller} />;
}

function ResourceListViewBody<TRow, TFilters extends Record<string, any>>({
  resource,
  controller,
  navigate,
  columns,
  rowActions,
  toolbar,
  statsClassName,
  children,
}: ResourceListViewProps<TRow, TFilters> & { controller: ResourceController<TRow, TFilters> }) {
  const renderRowActions = rowActions ?? resource.rowActions;

  return (
    <div className="space-y-6">
      {children ? (
        children(controller)
      ) : (
        <>
          <ResourceStats resource={resource} controller={controller} className={statsClassName} />
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <ResourceFilters resource={resource} controller={controller} />
            </div>
            {toolbar}
          </div>
          <ResourceTable
            resource={resource}
            controller={controller}
            columns={columns}
            rowActions={
              renderRowActions ? (row) => renderRowActions({ row, controller, navigate }) : undefined
            }
          />
        </>
      )}

      {resource.api.remove && (() => {
        const dc = resource.deleteConfirm?.(controller.deleteDialog.data);
        return (
          <ConfirmDialog
            open={controller.deleteDialog.isOpen}
            onOpenChange={controller.deleteDialog.setOpen}
            title={dc?.title ?? `Delete this ${resource.title.toLowerCase()}?`}
            description={dc?.description}
            confirmLabel={dc?.confirmLabel}
            variant={dc?.variant ?? "destructive"}
            onConfirm={controller.handleDeleteConfirm}
            loading={controller.isDeleting}
          />
        );
      })()}
    </div>
  );
}
