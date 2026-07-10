"use client";

import * as React from "react";
import { Eye, Bus } from "lucide-react";
import { DataTable, Button } from "@busmate/ui";
import type { DataTableProps } from "@busmate/ui";
import type { BusResponse } from "@busmate/api-client-route";
import { fleetColumns } from "./FleetColumns";

// ── Types ─────────────────────────────────────────────────────────

interface FleetTableProps
  extends Pick<
    DataTableProps<BusResponse>,
    | "page"
    | "pageSize"
    | "onPageChange"
    | "onPageSizeChange"
    | "sortColumn"
    | "sortDirection"
    | "onSort"
    | "loading"
  > {
  data: BusResponse[];
  totalItems: number;
  onView: (bus: BusResponse) => void;
}

// ── Component ─────────────────────────────────────────────────────

/**
 * Fleet (buses) data table.
 *
 * Composes the shared `DataTable` pattern with bus-specific
 * column definitions and a view-only row action (read-only fleet).
 */
export function FleetTable({
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
}: FleetTableProps) {
  const rowActions = React.useCallback(
    (bus: BusResponse) => (
      <div className="flex items-center justify-end">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onView(bus)}
          title="View bus details"
        >
          <Eye className="h-3.5 w-3.5 text-primary" />
        </Button>
      </div>
    ),
    [onView],
  );

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Bus className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
      <h3 className="text-base font-semibold mb-1">No buses found</h3>
      <p className="text-sm text-muted-foreground">
        Try adjusting your search or filters.
      </p>
    </div>
  );

  return (
    <DataTable<BusResponse>
      columns={fleetColumns}
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
      getRowId={(bus) => bus.id!}
      rowActions={rowActions}
      emptyState={emptyState}
    />
  );
}
