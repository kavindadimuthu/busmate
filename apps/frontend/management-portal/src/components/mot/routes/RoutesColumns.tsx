"use client";

import * as React from "react";
import { Route as RouteIcon, Navigation, MapPin } from "lucide-react";
import type { ColumnDef } from "@busmate/ui";

function formatDate(dateString?: string): string {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export const routesColumns: ColumnDef<any>[] = [
  {
    id: "name",
    header: "Route Name",
    sortable: true,
    cell: ({ row }) => (
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <RouteIcon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <span className="text-sm font-semibold truncate block">
            {row.name || "Unnamed Route"}
          </span>
          {row.description && (
            <span
              className="text-[11px] text-muted-foreground truncate block max-w-[200px]"
              title={row.description}
            >
              {row.description}
            </span>
          )}
        </div>
      </div>
    ),
  },
  {
    id: "routeGroupName",
    header: "Route Group",
    cell: ({ row }) => (
      <span className="text-sm">{row.routeGroupName || "—"}</span>
    ),
  },
  {
    id: "direction",
    header: "Direction",
    sortable: true,
    cell: ({ row }) => {
      if (row.direction === "OUTBOUND") {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
            <Navigation className="w-3.5 h-3.5" />
            Outbound
          </span>
        );
      }
      if (row.direction === "INBOUND") {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-success/10 text-success border border-success/20">
            <Navigation className="w-3.5 h-3.5 rotate-180" />
            Inbound
          </span>
        );
      }
      return <span className="text-xs text-muted-foreground">—</span>;
    },
  },
  {
    id: "startStop",
    header: "Route",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-sm">
        <MapPin className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
        <span className="truncate max-w-[90px]" title={row.startStopName || undefined}>
          {row.startStopName || "—"}
        </span>
        <span className="text-muted-foreground/50 shrink-0">→</span>
        <span className="truncate max-w-[90px]" title={row.endStopName || undefined}>
          {row.endStopName || "—"}
        </span>
      </div>
    ),
  },
  {
    id: "distanceKm",
    header: "Distance",
    sortable: true,
    cell: ({ row }) =>
      row.distanceKm != null ? (
        <span className="text-sm tabular-nums">
          {row.distanceKm.toFixed(1)}{" "}
          <span className="text-[11px] text-muted-foreground">km</span>
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
  },
  {
    id: "estimatedDurationMinutes",
    header: "Duration",
    sortable: true,
    cell: ({ row }) =>
      row.estimatedDurationMinutes != null ? (
        <span className="text-sm tabular-nums">
          {row.estimatedDurationMinutes}{" "}
          <span className="text-[11px] text-muted-foreground">min</span>
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
  },
  {
    id: "createdAt",
    header: "Created",
    sortable: true,
    hideBelow: "lg",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground tabular-nums">
        {formatDate(row.createdAt)}
      </span>
    ),
  },
];
