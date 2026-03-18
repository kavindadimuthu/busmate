"use client";

import * as React from "react";
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Users,
  Route as RouteIcon,
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

function getDaysOfWeek(scheduleCalendars?: any[]): string {
  if (!scheduleCalendars || scheduleCalendars.length === 0) return "—";
  const cal = scheduleCalendars[0];
  const days: string[] = [];
  if (cal?.monday) days.push("Mon");
  if (cal?.tuesday) days.push("Tue");
  if (cal?.wednesday) days.push("Wed");
  if (cal?.thursday) days.push("Thu");
  if (cal?.friday) days.push("Fri");
  if (cal?.saturday) days.push("Sat");
  if (cal?.sunday) days.push("Sun");
  return days.length > 0 ? days.join(", ") : "—";
}

function getStatusMeta(status?: string) {
  switch (status) {
    case "ACTIVE":
      return { icon: <CheckCircle className="w-3.5 h-3.5" />, label: "Active", cls: "bg-green-50 text-green-700 border-green-200" };
    case "INACTIVE":
      return { icon: <XCircle className="w-3.5 h-3.5" />, label: "Inactive", cls: "bg-red-50 text-red-700 border-red-200" };
    case "PENDING":
      return { icon: <Clock className="w-3.5 h-3.5" />, label: "Pending", cls: "bg-amber-50 text-amber-700 border-amber-200" };
    case "CANCELLED":
      return { icon: <XCircle className="w-3.5 h-3.5" />, label: "Cancelled", cls: "bg-gray-100 text-gray-600 border-gray-200" };
    default:
      return { icon: <AlertCircle className="w-3.5 h-3.5" />, label: status ?? "Unknown", cls: "bg-gray-100 text-gray-500 border-gray-200" };
  }
}

export const schedulesColumns: ColumnDef<any>[] = [
  {
    id: "name",
    header: "Schedule",
    sortable: true,
    cell: ({ row }) => (
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Calendar className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <span className="text-sm font-semibold truncate block">{row.name || "Unnamed Schedule"}</span>
          {row.description && (
            <span className="text-[11px] text-muted-foreground truncate block" title={row.description}>
              {row.description}
            </span>
          )}
        </div>
      </div>
    ),
  },
  {
    id: "routeName",
    header: "Route",
    cell: ({ row }) => (
      <div className="flex items-start gap-1.5">
        <RouteIcon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
        <span className="text-sm truncate">{row.routeName || "—"}</span>
      </div>
    ),
  },
  {
    id: "scheduleType",
    header: "Type",
    cell: ({ row }) => {
      if (row.scheduleType === "REGULAR") {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Calendar className="w-3 h-3" />
            Regular
          </span>
        );
      }
      if (row.scheduleType === "SPECIAL") {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
            <Users className="w-3 h-3" />
            Special
          </span>
        );
      }
      return <span className="text-xs text-muted-foreground italic">—</span>;
    },
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const { icon, label, cls } = getStatusMeta(row.status);
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cls}`}>
          {icon}
          {label}
        </span>
      );
    },
  },
  {
    id: "operatingDays",
    header: "Operating Days",
    cell: ({ row }) => (
      <span className="text-[11px] text-muted-foreground">{getDaysOfWeek(row.scheduleCalendars)}</span>
    ),
  },
  {
    id: "effectiveStartDate",
    header: "Effective Period",
    sortable: true,
    cell: ({ row }) => (
      <div className="space-y-0.5">
        <span className="text-xs tabular-nums block">{formatDate(row.effectiveStartDate)}</span>
        <span className="text-[11px] text-muted-foreground tabular-nums block">to {formatDate(row.effectiveEndDate)}</span>
      </div>
    ),
  },
  {
    id: "createdAt",
    header: "Created",
    sortable: true,
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground tabular-nums">{formatDate(row.createdAt)}</span>
    ),
  },
];
