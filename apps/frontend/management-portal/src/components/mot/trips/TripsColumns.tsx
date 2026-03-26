"use client";

import * as React from "react";
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Users,
  Bus,
  FileText,
  Navigation2,
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

function formatTime(timeString?: string): string {
  if (!timeString) return "—";
  try {
    const timePart = timeString.includes("T") ? timeString.split("T")[1] : timeString;
    const [hours, minutes] = timePart.split(":");
    return `${hours}:${minutes}`;
  } catch {
    return "—";
  }
}

function getStatusMeta(status?: string) {
  const s = status?.toLowerCase();
  switch (s) {
    case "active":
      return { icon: <CheckCircle className="w-3.5 h-3.5" />, label: "Active", cls: "bg-success/10 text-success border-success/20" };
    case "completed":
      return { icon: <CheckCircle className="w-3.5 h-3.5" />, label: "Completed", cls: "bg-success/10 text-success border-success/20" };
    case "pending":
      return { icon: <Clock className="w-3.5 h-3.5" />, label: "Pending", cls: "bg-warning/10 text-warning border-warning/20" };
    case "cancelled":
      return { icon: <XCircle className="w-3.5 h-3.5" />, label: "Cancelled", cls: "bg-destructive/10 text-destructive border-destructive/20" };
    case "delayed":
      return { icon: <AlertCircle className="w-3.5 h-3.5" />, label: "Delayed", cls: "bg-warning/10 text-orange-700 border-orange-200" };
    case "in_transit":
      return { icon: <Navigation2 className="w-3.5 h-3.5" />, label: "In Transit", cls: "bg-primary/10 text-primary border-primary/20" };
    case "boarding":
      return { icon: <Users className="w-3.5 h-3.5" />, label: "Boarding", cls: "bg-[hsl(var(--purple-50))] text-[hsl(var(--purple-700))] border-[hsl(var(--purple-200))]" };
    case "departed":
      return { icon: <CheckCircle className="w-3.5 h-3.5" />, label: "Departed", cls: "bg-primary/10 text-indigo-700 border-indigo-200" };
    default:
      return { icon: <AlertCircle className="w-3.5 h-3.5" />, label: status ?? "Unknown", cls: "bg-muted text-muted-foreground border-border" };
  }
}

export const tripsColumns: ColumnDef<any>[] = [
  {
    id: "tripDate",
    header: "Trip Date",
    sortable: true,
    cell: ({ row }) => (
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Calendar className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <span className="text-sm font-semibold truncate block">{formatDate(row.tripDate)}</span>
          <span className="text-[11px] text-muted-foreground font-mono truncate block">#{row.id?.slice(-8)}</span>
        </div>
      </div>
    ),
  },
  {
    id: "routeName",
    header: "Route",
    sortable: true,
    cell: ({ row }) => (
      <div className="min-w-0">
        <span className="text-sm font-semibold truncate block">{row.routeName || "—"}</span>
        {row.routeGroupName && (
          <span className="text-[11px] text-muted-foreground truncate block">{row.routeGroupName}</span>
        )}
      </div>
    ),
  },
  {
    id: "scheduleName",
    header: "Schedule",
    sortable: true,
    cell: ({ row }) => <span className="text-sm">{row.scheduleName || "—"}</span>,
  },
  {
    id: "operatorName",
    header: "Operator",
    cell: ({ row }) => <span className="text-sm">{row.operatorName || "—"}</span>,
  },
  {
    id: "scheduledDepartureTime",
    header: "Departure",
    cell: ({ row }) => (
      <div>
        <span className="text-sm font-semibold">{formatTime(row.scheduledDepartureTime)}</span>
        {row.actualDepartureTime && (
          <span className="text-[11px] text-muted-foreground block">Actual: {formatTime(row.actualDepartureTime)}</span>
        )}
      </div>
    ),
  },
  {
    id: "assignments",
    header: "Assignments",
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
            row.passengerServicePermitId
              ? "bg-success/10 text-success border-success/20"
              : "bg-muted text-muted-foreground/70 border-border"
          }`}
        >
          <FileText className="w-3 h-3 shrink-0" />
          {row.passengerServicePermitId ? (row.passengerServicePermitNumber ?? "PSP Assigned") : "No PSP"}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
            row.busId
              ? "bg-primary/10 text-primary border-primary/20"
              : "bg-muted text-muted-foreground/70 border-border"
          }`}
        >
          <Bus className="w-3 h-3 shrink-0" />
          {row.busId ? (row.busPlateNumber ?? "Bus Assigned") : "No Bus"}
        </span>
      </div>
    ),
  },
  {
    id: "status",
    header: "Status",
    sortable: true,
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
];
