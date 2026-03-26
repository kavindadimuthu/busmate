"use client";

import * as React from "react";
import {
  Users,
  Phone,
  Mail,
  MapPin,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { ColumnDef } from "@busmate/ui";

function formatDate(dateString?: string): string {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleDateString("en-LK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function getStatusStyle(status?: string) {
  switch (status) {
    case "active":
      return { className: "bg-success/10 text-success border border-success/20", Icon: CheckCircle2 };
    case "inactive":
      return { className: "bg-destructive/10 text-destructive border border-destructive/20", Icon: XCircle };
    default:
      return { className: "bg-muted text-muted-foreground border border-border", Icon: Users };
  }
}

function getTypeStyle(type?: string) {
  switch (type) {
    case "timekeeper":
      return { className: "bg-primary/10 text-primary border border-primary/20", Icon: Clock };
    case "inspector":
      return { className: "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20", Icon: Search };
    default:
      return { className: "bg-muted text-muted-foreground border border-border", Icon: Users };
  }
}

export const staffColumns: ColumnDef<any>[] = [
  {
    id: "fullName",
    header: "Full Name",
    sortable: true,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
          <span className="text-sm font-semibold text-primary">
            {(row.fullName || "?").charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate leading-tight">
            {row.fullName}
          </p>
          <p className="text-[11px] text-muted-foreground/70 font-mono leading-tight mt-0.5 truncate">
            {row.nic || "—"}
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "contact",
    header: "Contact",
    cell: ({ row }) => (
      <div className="space-y-0.5">
        <div className="flex items-center gap-1.5">
          <Phone className="w-3 h-3 text-muted-foreground/50 shrink-0" />
          <span className="text-sm text-foreground/80">{row.phone || "—"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Mail className="w-3 h-3 text-muted-foreground/50 shrink-0" />
          <span className="text-[11px] text-muted-foreground/70 truncate">{row.email || "—"}</span>
        </div>
      </div>
    ),
  },
  {
    id: "staffType",
    header: "Type",
    sortable: true,
    cell: ({ row }) => {
      const { className, Icon } = getTypeStyle(row.staffType);
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${className}`}>
          <Icon className="w-3.5 h-3.5" />
          {row.staffType || "Unknown"}
        </span>
      );
    },
  },
  {
    id: "assignedLocation",
    header: "Assignment",
    cell: ({ row }) => (
      <div className="flex items-start gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-muted-foreground/50 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm text-foreground/80 truncate leading-tight">
            {row.assignedLocation || "—"}
          </p>
          {row.province && (
            <p className="text-[11px] text-muted-foreground/70 truncate leading-tight mt-0.5">
              {row.province}
            </p>
          )}
        </div>
      </div>
    ),
  },
  {
    id: "status",
    header: "Status",
    sortable: true,
    cell: ({ row }) => {
      const { className, Icon } = getStatusStyle(row.status);
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${className}`}>
          <Icon className="w-3.5 h-3.5" />
          {row.status || "Unknown"}
        </span>
      );
    },
  },
  {
    id: "createdAt",
    header: "Joined",
    sortable: true,
    hideBelow: "lg",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground tabular-nums">
        {formatDate(row.createdAt)}
      </span>
    ),
  },
];
