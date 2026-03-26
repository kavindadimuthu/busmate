"use client";

import * as React from "react";
import { Eye, Edit2, Trash2, Settings, FileText } from "lucide-react";
import { DataTable, Button, EmptyState } from "@busmate/ui";
import type { DataTableProps } from "@busmate/ui";
import { permitsColumns } from "./permits-columns";

// ── Types ─────────────────────────────────────────────────────────

interface PermitsTableNewProps
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
  onView: (permit: any) => void;
  onEdit: (permit: any) => void;
  onDelete: (permit: any) => void;
  onAssignBus?: (permit: any) => void;
}

// ── Component ─────────────────────────────────────────────────────

export function PermitsTableNew({
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
  onAssignBus,
}: PermitsTableNewProps) {
  const rowActions = React.useCallback(
    (permit: any) => (
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onView(permit)}
          title="View details"
        >
          <Eye className="h-3.5 w-3.5 text-primary" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(permit)}
          title="Edit"
        >
          <Edit2 className="h-3.5 w-3.5 text-warning/80" />
        </Button>
        {onAssignBus && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onAssignBus(permit)}
            title="Assign Bus"
          >
            <Settings className="h-3.5 w-3.5 text-success" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(permit)}
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    ),
    [onView, onEdit, onDelete, onAssignBus],
  );

  return (
    <DataTable<any>
      columns={permitsColumns}
      data={data}
      totalItems={totalItems}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSort={onSort}
      getRowId={(permit) => permit.id}
      loading={loading}
      rowActions={rowActions}
      emptyState={
        <EmptyState
          icon={<FileText className="h-8 w-8" />}
          title="No permits found"
          description="Try adjusting your search or filters to find what you're looking for."
        />
      }
    />
  );
}
