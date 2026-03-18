"use client";

import * as React from "react";
import {
  Bus,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
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

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  INACTIVE: "bg-red-50 text-red-600 border-red-200",
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  CANCELLED: "bg-gray-100 text-gray-600 border-gray-200",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  ACTIVE: <CheckCircle className="w-3.5 h-3.5" />,
  INACTIVE: <XCircle className="w-3.5 h-3.5" />,
  PENDING: <Clock className="w-3.5 h-3.5" />,
  CANCELLED: <XCircle className="w-3.5 h-3.5" />,
};

export const busesColumns: ColumnDef<any>[] = [
  {
    id: "ntcRegistrationNumber",
    header: "Registration",
    sortable: true,
    cell: ({ row }) => (
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Bus className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <span className="text-sm font-semibold truncate block">
            {row.ntcRegistrationNumber || row.ntc_registration_number || "N/A"}
          </span>
          <span className="text-[11px] text-muted-foreground font-mono truncate block">
            #{row.id?.slice(0, 8)}
          </span>
        </div>
      </div>
    ),
  },
  {
    id: "plateNumber",
    header: "Plate Number",
    sortable: true,
    cell: ({ row }) => (
      <span className="text-sm font-mono">
        {row.plateNumber || row.plate_number || "—"}
      </span>
    ),
  },
  {
    id: "operator.name",
    header: "Operator",
    sortable: true,
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
        <span className="text-sm truncate">
          {row.operator?.name || row.operatorName || "Unknown"}
        </span>
      </div>
    ),
  },
  {
    id: "model",
    header: "Model",
    sortable: true,
    cell: ({ row }) => (
      <span className="text-sm">{row.model || "—"}</span>
    ),
  },
  {
    id: "capacity",
    header: "Capacity",
    sortable: true,
    cell: ({ row }) => (
      <span className="text-sm tabular-nums">
        {row.capacity ?? "—"}
        {row.capacity != null && (
          <span className="text-[11px] text-muted-foreground ml-0.5">seats</span>
        )}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    sortable: true,
    cell: ({ row }) => {
      const s = (row.status ?? "").toUpperCase();
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
            STATUS_STYLES[s] ?? "bg-gray-100 text-gray-600 border-gray-200"
          }`}
        >
          {STATUS_ICONS[s] ?? <AlertTriangle className="w-3.5 h-3.5" />}
          {s ? s.charAt(0) + s.slice(1).toLowerCase() : "Unknown"}
        </span>
      );
    },
  },
  {
    id: "createdAt",
    header: "Created",
    sortable: true,
    hideBelow: "lg",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground tabular-nums">
        {formatDate(row.createdAt || row.created_at)}
      </span>
    ),
  },
];
