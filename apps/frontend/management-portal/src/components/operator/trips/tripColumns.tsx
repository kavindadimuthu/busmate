"use client";

import * as React from "react";
import { Calendar, MapPin, Bus, FileText, CheckCircle, XCircle, Clock, AlertTriangle, Navigation2, Users } from "lucide-react";
import type { ColumnDef } from "@busmate/ui";
import type { TripResponse } from "@busmate/api-client-route";

function formatDate(dateString?: string): string {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

function formatTime(timeString?: string): string {
  if (!timeString) return "—";
  const [hours, minutes] = timeString.split(":");
  return `${hours}:${minutes}`;
}

const STATUS_META: Record<string, { label: string; icon: React.ReactNode; classes: string }> = {
  pending: { label: "Pending", icon: <Clock className="w-3.5 h-3.5" />, classes: "bg-warning/15 text-warning border-warning/20" },
  active: { label: "Active", icon: <CheckCircle className="w-3.5 h-3.5" />, classes: "bg-success/15 text-success border-success/20" },
  boarding: { label: "Boarding", icon: <Users className="w-3.5 h-3.5" />, classes: "bg-[hsl(var(--purple-50))] text-[hsl(var(--purple-700))] border-[hsl(var(--purple-200))]" },
  in_transit: { label: "In Transit", icon: <Navigation2 className="w-3.5 h-3.5" />, classes: "bg-primary/10 text-primary border-primary/20" },
  departed: { label: "Departed", icon: <Navigation2 className="w-3.5 h-3.5" />, classes: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  delayed: { label: "Delayed", icon: <AlertTriangle className="w-3.5 h-3.5" />, classes: "bg-warning/15 text-orange-700 border-orange-200" },
  completed: { label: "Completed", icon: <CheckCircle className="w-3.5 h-3.5" />, classes: "bg-success/15 text-success border-success/20" },
  cancelled: { label: "Cancelled", icon: <XCircle className="w-3.5 h-3.5" />, classes: "bg-destructive/10 text-destructive border-destructive/20" },
};

export const tripColumns: ColumnDef<TripResponse>[] = [
  {
    id: "tripDate",
    header: "Trip Date",
    sortable: true,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center ring-1 ring-blue-200/60">
          <Calendar className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate leading-tight">{formatDate(row.tripDate)}</p>
          <p className="text-[11px] text-muted-foreground/70 leading-tight mt-0.5">{formatTime(row.scheduledDepartureTime)} - {formatTime(row.scheduledArrivalTime)}</p>
        </div>
      </div>
    ),
  },
  {
    id: "routeName",
    header: "Route",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 min-w-0">
        <MapPin className="w-4 h-4 text-primary/70 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate leading-tight">{row.routeName || "—"}</p>
          <p className="text-[11px] text-muted-foreground/70 leading-tight mt-0.5 truncate">{row.scheduleName || "—"}</p>
        </div>
      </div>
    ),
  },
  {
    id: "assignments",
    header: "Assignments",
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border w-fit ${row.busId ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground/70 border-border"}`}>
          <Bus className="w-3 h-3 shrink-0" />
          {row.busId ? (row.busPlateNumber ?? "Bus Assigned") : "No Bus"}
        </span>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border w-fit ${row.conductorId ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground/70 border-border"}`}>
          <Users className="w-3 h-3 shrink-0" />
          {row.conductorId ? "Conductor Assigned" : "No Conductor"}
        </span>
      </div>
    ),
  },
  {
    id: "passengerServicePermitNumber",
    header: "Permit",
    cell: ({ row }) => (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <FileText className="w-3.5 h-3.5 shrink-0" />
        {row.permitNumber ?? "Not assigned"}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    sortable: true,
    cell: ({ row }) => {
      const meta = STATUS_META[row.status ?? ""] ?? STATUS_META.pending;
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${meta.classes}`}>
          {meta.icon}
          {meta.label}
        </span>
      );
    },
  },
];
