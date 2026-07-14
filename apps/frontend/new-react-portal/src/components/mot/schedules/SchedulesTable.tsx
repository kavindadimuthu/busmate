"use client";

import * as React from "react";
import { Eye, Edit2, Trash2, Users, Calendar } from "lucide-react";
import { Button, DataTable, EmptyState } from "@busmate/ui";
import { schedulesColumns } from "./SchedulesColumns";

interface SchedulesTableProps {
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
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAssignBuses: (id: string) => void;
  hasActiveFilters?: boolean;
}

export function SchedulesTable({
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
  onEdit,
  onDelete,
  onAssignBuses,
  hasActiveFilters = false,
}: SchedulesTableProps) {
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
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(row.id)}
          title="Edit schedule"
        >
          <Edit2 className="h-3.5 w-3.5 text-primary" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onAssignBuses(row.id)}
          title="Assign buses"
        >
          <Users className="h-3.5 w-3.5 text-primary" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onDelete(row.id)}
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
    ),
    [onView, onEdit, onDelete, onAssignBuses]
  );

  return (
    <DataTable
      columns={schedulesColumns}
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
          title="No schedules found"
          description={
            hasActiveFilters
              ? "Try adjusting your search or filters to find what you're looking for."
              : 'No schedules have been created yet. Click "Add Schedule" to get started.'
          }
        />
      }
    />
  );
}
