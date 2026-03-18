"use client";

import * as React from "react";
import {
  Bus,
  CheckCircle,
  XCircle,
  Wrench,
  AlertCircle,
  MapPin,
  User,
} from "lucide-react";
import type { ColumnDef } from "@busmate/ui";
import type { OperatorBus, BusStatus, BusServiceType } from "@/data/operator/buses";

// ── Helpers ───────────────────────────────────────────────────────

const STATUS_META: Record<
  BusStatus,
  { label: string; icon: React.ReactNode; classes: string }
> = {
  ACTIVE: {
    label: "Active",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    classes: "bg-green-100 text-green-800 border-green-200",
  },
  INACTIVE: {
    label: "Inactive",
    icon: <XCircle className="w-3.5 h-3.5" />,
    classes: "bg-orange-100 text-orange-800 border-orange-200",
  },
  MAINTENANCE: {
    label: "Maintenance",
    icon: <Wrench className="w-3.5 h-3.5" />,
    classes: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  RETIRED: {
    label: "Retired",
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    classes: "bg-gray-100 text-gray-600 border-gray-200",
  },
};

const SERVICE_TYPE_LABELS: Record<BusServiceType, string> = {
  SL: "SL",
  SL_AC: "SL A/C",
  SEMI_LUXURY: "Semi-Luxury",
  LUXURY: "Luxury",
  EXPRESS: "Express",
};

// ── Column definitions ────────────────────────────────────────────

export const fleetColumns: ColumnDef<OperatorBus>[] = [
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
            {row.plateNumber}
          </p>
          <p className="text-[11px] text-muted-foreground font-mono leading-tight mt-0.5 truncate">
            {row.ntcRegistrationNumber}
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
      <div>
        <p className="text-sm text-foreground">{row.model}</p>
        <p className="text-xs text-muted-foreground">{row.manufacturer}</p>
      </div>
    ),
  },
  {
    id: "serviceType",
    header: "Service Type",
    sortable: true,
    cell: ({ row }) => (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
        {SERVICE_TYPE_LABELS[row.serviceType] ?? row.serviceType}
      </span>
    ),
  },
  {
    id: "year",
    header: "Year",
    sortable: true,
    hideBelow: "md",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.year}</span>
    ),
  },
  {
    id: "seatingCapacity",
    header: "Seats",
    sortable: true,
    hideBelow: "md",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.seatingCapacity}</span>
    ),
  },
  {
    id: "status",
    header: "Status",
    sortable: true,
    cell: ({ row }) => {
      const meta = STATUS_META[row.status] ?? STATUS_META.RETIRED;
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
  {
    id: "driver",
    header: "Driver",
    hideBelow: "lg",
    cell: ({ row }) =>
      row.driver ? (
        <div className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
          <span className="text-sm text-foreground truncate max-w-[130px]">
            {row.driver.driverName}
          </span>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground italic">Unassigned</span>
      ),
  },
  {
    id: "route",
    header: "Route",
    hideBelow: "lg",
    cell: ({ row }) =>
      row.routeAssignments[0] ? (
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
          <span className="text-sm text-foreground truncate max-w-[160px]">
            {row.routeAssignments[0].routeName}
          </span>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground italic">No route</span>
      ),
  },
];
