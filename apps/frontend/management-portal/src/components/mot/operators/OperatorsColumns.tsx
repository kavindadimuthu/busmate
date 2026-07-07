"use client";

import * as React from "react";
import { Building, MapPin, Users, CheckCircle, XCircle, Clock } from "lucide-react";
import type { ColumnDef } from "@busmate/ui";
import type { OperatorResponse } from "@busmate/api-client-route";

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

const STATUS_STYLES: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  inactive: "bg-destructive/10 text-destructive border-destructive/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  cancelled: "bg-muted text-muted-foreground border-border",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  active: <CheckCircle className="w-3.5 h-3.5" />,
  inactive: <XCircle className="w-3.5 h-3.5" />,
  pending: <Clock className="w-3.5 h-3.5" />,
  cancelled: <XCircle className="w-3.5 h-3.5" />,
};

const TYPE_STYLES: Record<string, string> = {
  PRIVATE: "bg-primary/10 text-primary border-primary/20",
  CTB: "bg-success/10 text-success border-success/20",
};

// ── Column definitions ────────────────────────────────────────────

export const operatorsColumns: ColumnDef<OperatorResponse>[] = [
  {
    id: "name",
    header: "Operator Name",
    sortable: true,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Building className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate leading-tight">
            {row.name || "Unnamed Operator"}
          </p>
          <p className="text-[11px] text-muted-foreground font-mono leading-tight mt-0.5 truncate">
            #{row.id?.slice(0, 8)}
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "operatorType",
    header: "Type",
    cell: ({ row }) => {
      const type = row.operatorType ?? "";
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
            TYPE_STYLES[type] ?? "bg-muted text-muted-foreground border-border"
          }`}
        >
          {type === "CTB" ? (
            <Users className="w-3 h-3" />
          ) : (
            <Building className="w-3 h-3" />
          )}
          {type === "PRIVATE" ? "Private" : type === "CTB" ? "CTB" : "Unknown"}
        </span>
      );
    },
  },
  {
    id: "region",
    header: "Region",
    cell: ({ row }) =>
      row.region ? (
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
          <span className="text-sm text-foreground truncate">{row.region}</span>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground/40 italic">—</span>
      ),
  },
  {
    id: "status",
    header: "Status",
    sortable: true,
    cell: ({ row }) => {
      const s = row.status ?? "";
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
            STATUS_STYLES[s] ?? "bg-muted text-muted-foreground border-border"
          }`}
        >
          {STATUS_ICONS[s] ?? <Clock className="w-3.5 h-3.5" />}
          {s ? s.charAt(0).toUpperCase() + s.slice(1) : "Unknown"}
        </span>
      );
    },
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
  {
    id: "updatedAt",
    header: "Updated",
    sortable: true,
    hideBelow: "md",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground tabular-nums">
        {formatDate(row.updatedAt)}
      </span>
    ),
  },
];
