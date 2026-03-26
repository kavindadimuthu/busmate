"use client";

import * as React from "react";
import { Eye, Edit2, Trash2, MapPin } from "lucide-react";
import { DataTable, Button, EmptyState } from "@busmate/ui";
import type { DataTableProps } from "@busmate/ui";
import type { StopResponse } from "@busmate/api-client-route";
import { busStopsColumns } from "./BusStopsColumns";

// ── Types ─────────────────────────────────────────────────────────

interface BusStopsTableProps
  extends Pick<
    DataTableProps<StopResponse>,
    | "page"
    | "pageSize"
    | "onPageChange"
    | "onPageSizeChange"
    | "sortColumn"
    | "sortDirection"
    | "onSort"
    | "loading"
  > {
  data: StopResponse[];
  totalItems: number;
  onView: (stop: StopResponse) => void;
  onEdit: (stop: StopResponse) => void;
  onDelete: (stop: StopResponse) => void;
}

// ── Component ─────────────────────────────────────────────────────

/**
 * Bus-stop data table.
 *
 * Composes the shared `DataTable` pattern with bus-stop-specific
 * column definitions and row actions.
 */
export function BusStopsTable({
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
}: BusStopsTableProps) {
  const rowActions = React.useCallback(
    (stop: StopResponse) => (
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onView(stop)}
          title="View details"
        >
          <Eye className="h-3.5 w-3.5 text-primary" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(stop)}
          title="Edit stop"
        >
          <Edit2 className="h-3.5 w-3.5 text-warning/80" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(stop)}
          title="Delete stop"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    ),
    [onView, onEdit, onDelete],
  );

  return (
    <DataTable<StopResponse>
      columns={busStopsColumns}
      data={data}
      totalItems={totalItems}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSort={onSort}
      getRowId={(stop) => stop.id!}
      loading={loading}
      rowActions={rowActions}
      emptyState={
        <EmptyState
          icon={<MapPin className="h-8 w-8" />}
          title="No bus stops found"
          description="Try adjusting your search or filters to find what you're looking for."
        />
      }
    />
  );
}
