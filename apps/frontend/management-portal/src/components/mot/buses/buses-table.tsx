"use client";

import * as React from "react";
import { Eye, Edit2, Trash2, Settings, Bus } from "lucide-react";
import { DataTable, Button, EmptyState } from "@busmate/ui";
import type { DataTableProps } from "@busmate/ui";
import { busesColumns } from "./buses-columns";

interface BusesTableNewProps
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
  onView: (bus: any) => void;
  onEdit: (bus: any) => void;
  onDelete: (bus: any) => void;
  onAssignRoute?: (bus: any) => void;
}

export function BusesTableNew({
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
  onAssignRoute,
}: BusesTableNewProps) {
  const rowActions = React.useCallback(
    (bus: any) => (
      <div className="flex items-center justify-end gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(bus)} title="View details">
          <Eye className="h-3.5 w-3.5 text-primary" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(bus)} title="Edit">
          <Edit2 className="h-3.5 w-3.5 text-amber-500" />
        </Button>
        {onAssignRoute && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAssignRoute(bus)} title="Assign Route">
            <Settings className="h-3.5 w-3.5 text-emerald-500" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(bus)} title="Delete">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    ),
    [onView, onEdit, onDelete, onAssignRoute],
  );

  return (
    <DataTable<any>
      columns={busesColumns}
      data={data}
      totalItems={totalItems}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSort={onSort}
      getRowId={(bus) => bus.id}
      loading={loading}
      rowActions={rowActions}
      emptyState={
        <EmptyState
          icon={<Bus className="h-8 w-8" />}
          title="No buses found"
          description="Try adjusting your search or filters to find what you're looking for."
        />
      }
    />
  );
}
