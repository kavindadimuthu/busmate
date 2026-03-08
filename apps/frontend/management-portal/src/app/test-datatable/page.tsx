"use client";

import * as React from "react";
import { DataTable, useDataTable } from "@busmate/ui";
import type { ColumnDef } from "@busmate/ui";

// ── Mock data ─────────────────────────────────────────────────────────────────

interface MockRoute {
  id: string;
  routeNumber: string;
  name: string;
  origin: string;
  destination: string;
  distance: number;
  status: string;
}

const MOCK_ROUTES: MockRoute[] = [
  { id: "1", routeNumber: "R001", name: "City Express", origin: "Central", destination: "Airport", distance: 24.5, status: "active" },
  { id: "2", routeNumber: "R002", name: "Harbor Loop", origin: "Harbor", destination: "University", distance: 15.2, status: "active" },
  { id: "3", routeNumber: "R003", name: "North Shuttle", origin: "North Gate", destination: "Downtown", distance: 8.7, status: "inactive" },
  { id: "4", routeNumber: "R004", name: "East Corridor", origin: "East End", destination: "West Mall", distance: 31.1, status: "active" },
  { id: "5", routeNumber: "R005", name: "South Express", origin: "South Hub", destination: "Central", distance: 19.4, status: "pending" },
];

// ── Column definitions ─────────────────────────────────────────────────────────

const columns: ColumnDef<MockRoute>[] = [
  {
    id: "routeNumber",
    header: "Route No.",
    accessorKey: "routeNumber",
    sortable: true,
    width: "w-28",
    cell: ({ value }) => (
      <span className="font-mono font-medium text-primary">{String(value)}</span>
    ),
  },
  {
    id: "name",
    header: "Route Name",
    accessorKey: "name",
    sortable: true,
  },
  {
    id: "origin",
    header: "Origin",
    accessorKey: "origin",
    hideBelow: "md",
  },
  {
    id: "destination",
    header: "Destination",
    accessorKey: "destination",
    hideBelow: "md",
  },
  {
    id: "distance",
    header: "Distance",
    accessorFn: (row) => row.distance,
    hideBelow: "lg",
    align: "right",
    cell: ({ value }) => <span>{Number(value).toFixed(1)} km</span>,
  },
  {
    id: "status",
    header: "Status",
    accessorKey: "status",
    cell: ({ value }) => {
      const status = String(value);
      const colorMap: Record<string, string> = {
        active: "bg-emerald-100 text-emerald-700",
        inactive: "bg-gray-100 text-gray-600",
        pending: "bg-amber-100 text-amber-700",
      };
      return (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${colorMap[status] ?? "bg-gray-100 text-gray-600"}`}
        >
          {status}
        </span>
      );
    },
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DataTableTestPage() {
  const { state, setPage, setPageSize, setSort, toggleRow, toggleAll } =
    useDataTable<Record<string, unknown>>({ initialPageSize: 10 });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">DataTable Verification</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Step 16 — mock-data render test for the DataTable pattern.
        </p>
      </div>

      {/* Basic table (no selection) */}
      <section className="space-y-2">
        <h2 className="text-base font-medium">Basic Table</h2>
        <DataTable
          columns={columns}
          data={MOCK_ROUTES}
          totalItems={MOCK_ROUTES.length}
          page={state.page}
          pageSize={state.pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          sortColumn={state.sortColumn}
          sortDirection={state.sortDirection}
          onSort={setSort}
          getRowId={(r) => r.id}
        />
      </section>

      {/* Table with row selection */}
      <section className="space-y-2">
        <h2 className="text-base font-medium">Table with Row Selection</h2>
        <DataTable
          columns={columns}
          data={MOCK_ROUTES}
          totalItems={MOCK_ROUTES.length}
          page={state.page}
          pageSize={state.pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          sortColumn={state.sortColumn}
          sortDirection={state.sortDirection}
          onSort={setSort}
          getRowId={(r) => r.id}
          selectedRows={state.selectedRows}
          onToggleRow={toggleRow}
          onToggleAll={toggleAll}
        />
        <p className="text-xs text-muted-foreground">
          Selected: {[...state.selectedRows].join(", ") || "none"}
        </p>
      </section>

      {/* Loading state */}
      <section className="space-y-2">
        <h2 className="text-base font-medium">Loading State</h2>
        <DataTable
          columns={columns}
          data={[]}
          totalItems={0}
          page={1}
          pageSize={10}
          onPageChange={() => {}}
          onPageSizeChange={() => {}}
          getRowId={(r) => r.id}
          loading={true}
        />
      </section>

      {/* Empty state */}
      <section className="space-y-2">
        <h2 className="text-base font-medium">Empty State</h2>
        <DataTable
          columns={columns}
          data={[]}
          totalItems={0}
          page={1}
          pageSize={10}
          onPageChange={() => {}}
          onPageSizeChange={() => {}}
          getRowId={(r) => r.id}
          emptyState={
            <div className="flex flex-col items-center gap-2 py-4">
              <span className="text-4xl">🚌</span>
              <p className="text-muted-foreground text-sm">No routes found</p>
            </div>
          }
        />
      </section>
    </div>
  );
}
