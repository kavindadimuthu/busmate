"use client";

import * as React from "react";
import {
  FileText,
  Users,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import type { ColumnDef } from "@busmate/ui";

// ── Helpers ───────────────────────────────────────────────────────

function formatDate(dateString?: string): string {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Invalid date";
  }
}

function isExpiringSoon(expiryDate?: string): boolean {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const today = new Date();
  const diffDays = Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diffDays <= 30 && diffDays >= 0;
}

function isExpired(expiryDate?: string): boolean {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date();
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  INACTIVE: "bg-red-50 text-red-600 border-red-200",
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  EXPIRED: "bg-gray-100 text-gray-600 border-gray-200",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  ACTIVE: <CheckCircle className="w-3.5 h-3.5" />,
  INACTIVE: <XCircle className="w-3.5 h-3.5" />,
  PENDING: <Clock className="w-3.5 h-3.5" />,
  EXPIRED: <XCircle className="w-3.5 h-3.5" />,
};

// ── Column definitions ────────────────────────────────────────────

export const permitsColumns: ColumnDef<any>[] = [
  {
    id: "permitNumber",
    header: "Permit Number",
    sortable: true,
    cell: ({ row }) => (
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-semibold truncate">
          {row.permitNumber || "N/A"}
        </span>
      </div>
    ),
  },
  {
    id: "operatorName",
    header: "Operator",
    sortable: true,
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
        <span className="text-sm truncate">{row.operatorName || "Unknown"}</span>
      </div>
    ),
  },
  {
    id: "routeGroupName",
    header: "Route Group",
    sortable: true,
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5">
        <MapPin className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
        <span className="text-sm truncate">{row.routeGroupName || "N/A"}</span>
      </div>
    ),
  },
  {
    id: "permitType",
    header: "Type",
    sortable: true,
    cell: ({ row }) => (
      <span className="text-sm">{row.permitType || "N/A"}</span>
    ),
  },
  {
    id: "maximumBusAssigned",
    header: "Max Buses",
    sortable: true,
    cell: ({ row }) => (
      <span className="text-sm font-semibold tabular-nums">
        {row.maximumBusAssigned || 0}
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
    id: "expiryDate",
    header: "Expiry Date",
    sortable: true,
    hideBelow: "lg",
    cell: ({ row }) => {
      const expired = isExpired(row.expiryDate);
      const expiring = isExpiringSoon(row.expiryDate);
      return (
        <div>
          <span
            className={`text-xs tabular-nums ${
              expired
                ? "text-red-600"
                : expiring
                  ? "text-orange-600"
                  : "text-muted-foreground"
            }`}
          >
            {formatDate(row.expiryDate)}
          </span>
          {expiring && !expired && (
            <div className="flex items-center gap-0.5 text-xs text-orange-600 mt-0.5">
              <AlertTriangle className="h-3 w-3" />
              Expiring Soon
            </div>
          )}
          {expired && (
            <div className="flex items-center gap-0.5 text-xs text-red-600 mt-0.5">
              <XCircle className="h-3 w-3" />
              Expired
            </div>
          )}
        </div>
      );
    },
  },
];
