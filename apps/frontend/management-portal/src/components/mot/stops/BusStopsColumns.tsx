"use client";

import * as React from "react";
import { MapPin, Navigation2, CheckCircle2, XCircle } from "lucide-react";
import type { ColumnDef } from "@busmate/ui";
import type { StopResponse } from "@busmate/api-client-route";

// ── Helpers ───────────────────────────────────────────────────────

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

function formatLocation(
  location?: StopResponse["location"]
): { primary: string; secondary?: string } {
  if (!location) return { primary: "—" };
  const cityState = [location.city, location.state].filter(Boolean).join(", ");
  const address = location.address || "";
  if (cityState && address) return { primary: cityState, secondary: address };
  if (cityState) return { primary: cityState };
  if (address) return { primary: address };
  if (location.latitude != null && location.longitude != null) {
    return {
      primary: `${Number(location.latitude).toFixed(4)}, ${Number(location.longitude).toFixed(4)}`,
    };
  }
  return { primary: "—" };
}

// ── Column definitions ────────────────────────────────────────────

export const busStopsColumns: ColumnDef<StopResponse>[] = [
  {
    id: "name",
    header: "Stop Name",
    sortable: true,
    cell: ({ row }) => {
      const loc = formatLocation(row.location);
      return (
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate leading-tight">
              {row.name || "Unnamed Stop"}
            </p>
            <p className="text-[11px] text-muted-foreground font-mono leading-tight mt-0.5 truncate">
              #{row.id?.slice(0, 8)}
            </p>
          </div>
        </div>
      );
    },
  },
  {
    id: "location",
    header: "Location",
    cell: ({ row }) => {
      const loc = formatLocation(row.location);
      return (
        <div className="flex items-start gap-1.5">
          <Navigation2 className="w-3.5 h-3.5 text-muted-foreground/50 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm text-foreground truncate leading-tight">{loc.primary}</p>
            {loc.secondary && (
              <p
                className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5"
                title={loc.secondary}
              >
                {loc.secondary}
              </p>
            )}
          </div>
        </div>
      );
    },
  },
  {
    id: "isAccessible",
    header: "Accessibility",
    sortable: true,
    cell: ({ row }) =>
      row.isAccessible ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-success/10 text-success border border-success/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Accessible
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-destructive/10 text-destructive border border-destructive/20">
          <XCircle className="w-3.5 h-3.5" />
          Not Accessible
        </span>
      ),
  },
  {
    id: "description",
    header: "Description",
    hideBelow: "lg",
    cell: ({ row }) =>
      row.description ? (
        <p
          className="text-sm text-muted-foreground truncate max-w-[200px]"
          title={row.description}
        >
          {row.description}
        </p>
      ) : (
        <span className="text-xs text-muted-foreground/40 italic">—</span>
      ),
  },
  {
    id: "createdAt",
    header: "Created",
    sortable: true,
    hideBelow: "sm",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground tabular-nums">
        {formatDate(row.createdAt)}
      </span>
    ),
  },
];
