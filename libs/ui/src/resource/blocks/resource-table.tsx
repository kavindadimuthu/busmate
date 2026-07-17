import * as React from "react";
import { DataTable } from "../../patterns/data-table";
import type { ColumnDef } from "../../patterns/data-table";
import type { ResourceConfig, ResourceController } from "../types";

export interface ResourceTableProps<TRow, TFilters extends Record<string, any>> {
  resource: ResourceConfig<TRow, TFilters>;
  controller: ResourceController<TRow, TFilters>;
  /** Override the resource's default columns for this render (e.g. add a page-specific column) */
  columns?: ColumnDef<TRow>[];
  rowActions?: (row: TRow) => React.ReactNode;
  onRowClick?: (row: TRow) => void;
}

/** L2 block: DataTable wired to a resource controller's pagination/sort/loading state. */
export function ResourceTable<TRow, TFilters extends Record<string, any>>({
  resource,
  controller,
  columns,
  rowActions,
  onRowClick,
}: ResourceTableProps<TRow, TFilters>) {
  return (
    <DataTable<TRow>
      columns={columns ?? resource.columns}
      data={controller.rows}
      totalItems={controller.total}
      page={controller.state.page}
      pageSize={controller.state.pageSize}
      onPageChange={controller.setPage}
      onPageSizeChange={controller.setPageSize}
      sortColumn={controller.state.sortColumn}
      sortDirection={controller.state.sortDirection}
      onSort={controller.setSort}
      getRowId={resource.getRowId}
      loading={controller.isLoading}
      rowActions={rowActions}
      onRowClick={onRowClick}
      emptyState={resource.emptyState}
    />
  );
}
