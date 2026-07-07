"use client";

import * as React from "react";
import { Eye, Edit2, Trash2, Users } from "lucide-react";
import { DataTable, Button, EmptyState } from "@busmate/ui";
import type { DataTableProps } from "@busmate/ui";
import { staffColumns } from "./StaffColumns";

interface StaffTableProps
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
  onView: (staff: any) => void;
  onEdit: (staff: any) => void;
  onDelete: (staff: any) => void;
}

export function StaffTable({
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
}: StaffTableProps) {
  const rowActions = React.useCallback(
    (member: any) => (
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onView(member)}
          title="View details"
        >
          <Eye className="h-3.5 w-3.5 text-primary" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(member)}
          title="Edit staff member"
        >
          <Edit2 className="h-3.5 w-3.5 text-warning/80" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(member)}
          title="Delete staff member"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    ),
    [onView, onEdit, onDelete],
  );

  return (
    <DataTable<any>
      columns={staffColumns}
      data={data}
      totalItems={totalItems}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSort={onSort}
      getRowId={(member) => member.id}
      loading={loading}
      rowActions={rowActions}
      emptyState={
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="No staff members found"
          description="Try adjusting your search or filters to find what you're looking for."
        />
      }
    />
  );
}
