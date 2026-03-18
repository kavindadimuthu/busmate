"use client";

import * as React from "react";
import { Eye, Edit2, Trash2, Building } from "lucide-react";
import { DataTable, Button, EmptyState } from "@busmate/ui";
import type { DataTableProps } from "@busmate/ui";
import type { OperatorResponse } from "@busmate/api-client-route";
import { operatorsColumns } from "./operators-columns";

// ── Types ─────────────────────────────────────────────────────────

interface OperatorsTableProps
  extends Pick<
    DataTableProps<OperatorResponse>,
    | "page"
    | "pageSize"
    | "onPageChange"
    | "onPageSizeChange"
    | "sortColumn"
    | "sortDirection"
    | "onSort"
    | "loading"
  > {
  data: OperatorResponse[];
  totalItems: number;
  onView: (operator: OperatorResponse) => void;
  onEdit: (operator: OperatorResponse) => void;
  onDelete: (operator: OperatorResponse) => void;
}

// ── Component ─────────────────────────────────────────────────────

/**
 * Operators data table.
 *
 * Composes the shared `DataTable` pattern with operator-specific
 * column definitions and row actions.
 */
export function OperatorsTable({
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
}: OperatorsTableProps) {
  const rowActions = React.useCallback(
    (operator: OperatorResponse) => (
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onView(operator)}
          title="View details"
        >
          <Eye className="h-3.5 w-3.5 text-primary" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(operator)}
          title="Edit operator"
        >
          <Edit2 className="h-3.5 w-3.5 text-amber-500" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(operator)}
          title="Delete operator"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    ),
    [onView, onEdit, onDelete],
  );

  return (
    <DataTable<OperatorResponse>
      columns={operatorsColumns}
      data={data}
      totalItems={totalItems}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSort={onSort}
      getRowId={(operator) => operator.id!}
      loading={loading}
      rowActions={rowActions}
      emptyState={
        <EmptyState
          icon={<Building className="h-8 w-8" />}
          title="No operators found"
          description="Try adjusting your search or filters to find what you're looking for."
        />
      }
    />
  );
}
