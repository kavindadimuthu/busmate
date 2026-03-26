"use client";

import * as React from "react";
import { Eye, Trash2, Calendar } from "lucide-react";
import { Button, DataTable, EmptyState } from "@busmate/ui";
import { tripsColumns } from "./TripsColumns";

interface TripsTableProps {
  data: any[];
  loading: boolean;
  page: number;
  pageSize: number;
  totalItems: number;
  sortColumn: string | null;
  sortDirection: "asc" | "desc";
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSort: (column: string) => void;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  hasActiveFilters?: boolean;
}

export function TripsTable({
  data,
  loading,
  page,
  pageSize,
  totalItems,
  sortColumn,
  sortDirection,
  onPageChange,
  onPageSizeChange,
  onSort,
  onView,
  onDelete,
  hasActiveFilters = false,
}: TripsTableProps) {
  const rowActions = React.useCallback(
    (row: any) => (
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onView(row.id)}
          title="View details"
        >
          <Eye className="h-3.5 w-3.5 text-primary" />
        </Button>
        {["pending", "cancelled"].includes(row.status?.toLowerCase() ?? "") && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onDelete(row.id)}
            title="Delete trip"
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        )}
      </div>
    ),
    [onView, onDelete]
  );

  return (
    <DataTable
      columns={tripsColumns}
      data={data}
      loading={loading}
      page={page}
      pageSize={pageSize}
      totalItems={totalItems}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      onSort={onSort}
      getRowId={(row) => row.id}
      rowActions={rowActions}
      emptyState={
        <EmptyState
          icon={<Calendar className="h-5 w-5" />}
          title="No trips found"
          description={
            hasActiveFilters
              ? "No trips match your current filters. Try adjusting your search criteria."
              : "No trips have been created yet. Generate trips to get started."
          }
        />
      }
    />
  );
}
