"use client";

import * as React from "react";
import { Eye, Edit2, Trash2, Route as RouteIcon } from "lucide-react";
import { DataTable, Button, EmptyState } from "@busmate/ui";
import type { DataTableProps } from "@busmate/ui";
import { routesColumns } from "./RoutesColumns";

interface RoutesTableProps
  extends Pick<
    DataTableProps<any>,
    | "page"
    | "pageSize"
    | "onPageChange"
    | "onPageSizeChange"
    | "sortColumn"
    | "sortDirection"
    | "onSort"
    | "loading"
  > {
  data: any[];
  totalItems: number;
  onView: (route: any) => void;
  onEdit: (route: any) => void;
  onDelete: (route: any) => void;
}

export function RoutesTable({
  data,
  totalItems,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sortColumn,
  sortDirection,
  onSort,
  loading,
  onView,
  onEdit,
  onDelete,
}: RoutesTableProps) {
  const rowActions = React.useCallback(
    (route: any) => (
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onView(route)}
          title="View route"
        >
          <Eye className="h-3.5 w-3.5 text-primary" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(route)}
          title="Edit route"
        >
          <Edit2 className="h-3.5 w-3.5 text-warning/80" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(route)}
          title="Delete route"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    ),
    [onView, onEdit, onDelete],
  );

  return (
    <DataTable<any>
      columns={routesColumns}
      data={data}
      totalItems={totalItems}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSort={onSort}
      getRowId={(route) => route.id}
      loading={loading}
      rowActions={rowActions}
      emptyState={
        <EmptyState
          icon={<RouteIcon className="h-8 w-8" />}
          title="No routes found"
          description="Try adjusting your search or filters to find what you're looking for."
        />
      }
    />
  );
}
