"use client";

import * as React from "react";
import { Eye, Users } from "lucide-react";
import { DataTable, Button } from "@busmate/ui";
import type { DataTableProps } from "@busmate/ui";
import type { AdminUser } from "@/data/admin/users";
import { crewColumns } from "./CrewColumns";

interface CrewTableProps
  extends Pick<
    DataTableProps<AdminUser>,
    "page" | "pageSize" | "onPageChange" | "onPageSizeChange" | "sortColumn" | "sortDirection" | "onSort" | "loading"
  > {
  data: AdminUser[];
  totalItems: number;
  onView: (conductor: AdminUser) => void;
}

export function CrewTable({
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
}: CrewTableProps) {
  const rowActions = React.useCallback(
    (conductor: AdminUser) => (
      <div className="flex items-center justify-end">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(conductor)} title="View conductor">
          <Eye className="h-3.5 w-3.5 text-primary" />
        </Button>
      </div>
    ),
    [onView],
  );

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
      <h3 className="text-base font-semibold mb-1">No conductors found</h3>
      <p className="text-sm text-muted-foreground">Try adjusting your search or filters, or add a new conductor.</p>
    </div>
  );

  return (
    <DataTable<AdminUser>
      columns={crewColumns}
      data={data}
      totalItems={totalItems}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSort={onSort}
      loading={loading}
      getRowId={(c) => c.id}
      rowActions={rowActions}
      emptyState={emptyState}
    />
  );
}
