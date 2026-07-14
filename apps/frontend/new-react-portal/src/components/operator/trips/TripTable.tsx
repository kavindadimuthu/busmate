"use client";

import * as React from "react";
import { Eye, Calendar } from "lucide-react";
import { DataTable, Button } from "@busmate/ui";
import type { DataTableProps } from "@busmate/ui";
import type { TripResponse } from "@busmate/api-client-route";
import { tripColumns } from "./tripColumns";

interface TripTableProps
  extends Pick<
    DataTableProps<TripResponse>,
    "page" | "pageSize" | "onPageChange" | "onPageSizeChange" | "sortColumn" | "sortDirection" | "onSort" | "loading"
  > {
  data: TripResponse[];
  totalItems: number;
  onView: (trip: TripResponse) => void;
}

export function TripTable({
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
}: TripTableProps) {
  const rowActions = React.useCallback(
    (trip: TripResponse) => (
      <div className="flex items-center justify-end">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(trip)} title="View trip details">
          <Eye className="h-3.5 w-3.5 text-primary" />
        </Button>
      </div>
    ),
    [onView],
  );

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
      <h3 className="text-base font-semibold mb-1">No trips found</h3>
      <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
    </div>
  );

  return (
    <DataTable<TripResponse>
      columns={tripColumns}
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
      getRowId={(trip) => trip.id!}
      rowActions={rowActions}
      emptyState={emptyState}
    />
  );
}
