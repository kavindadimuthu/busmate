"use client";

import * as React from "react";
import { Bus, CheckCircle, XCircle, Clock, XOctagon } from "lucide-react";
import type { ColumnDef } from "@busmate/ui";
import type { BusResponse } from "@busmate/api-client-core";

// ── Helpers ───────────────────────────────────────────────────────
// Matches core-service's real Bus.status values (pending/active/inactive/cancelled) —
// same styling convention as MOT's OperatorsColumns.tsx for consistency.

const STATUS_META: Record<string, { label: string; icon: React.ReactNode; classes: string }> = {
  active: {
    label: "Active",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    classes: "bg-success/15 text-success border-success/20",
  },
  inactive: {
    label: "Inactive",
    icon: <XCircle className="w-3.5 h-3.5" />,
    classes: "bg-destructive/10 text-destructive border-destructive/20",
  },
  pending: {
    label: "Pending",
    icon: <Clock className="w-3.5 h-3.5" />,
    classes: "bg-warning/15 text-warning border-warning/20",
  },
  cancelled: {
    label: "Cancelled",
    icon: <XOctagon className="w-3.5 h-3.5" />,
    classes: "bg-muted text-muted-foreground border-border",
  },
};

// ── Column definitions ────────────────────────────────────────────

export const fleetColumns: ColumnDef<BusResponse>[] = [
  {
    id: "plateNumber",
    header: "Plate / Reg.",
    sortable: true,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Bus className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate leading-tight">
            {row.plateNumber || "Unknown Plate"}
          </p>
          <p className="text-[11px] text-muted-foreground font-mono leading-tight mt-0.5 truncate">
            {row.ntcRegistrationNumber || "—"}
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "model",
    header: "Model",
    sortable: true,
    cell: ({ row }) => (
      <span className="text-sm text-foreground">{row.model || "Not specified"}</span>
    ),
  },
  {
    id: "capacity",
    header: "Capacity",
    sortable: true,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.capacity ?? 0} seats</span>
    ),
  },
  {
    id: "status",
    header: "Status",
    sortable: true,
    cell: ({ row }) => {
      const meta = STATUS_META[row.status ?? ""] ?? STATUS_META.pending;
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${meta.classes}`}
        >
          {meta.icon}
          {meta.label}
        </span>
      );
    },
  },
];
