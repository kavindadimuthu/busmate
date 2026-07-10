"use client";

import * as React from "react";
import { CircleDot, Mail, Phone } from "lucide-react";
import type { ColumnDef } from "@busmate/ui";
import type { AdminUser } from "@/data/admin/users";
import { USER_STATUS_CONFIG, formatDateShort } from "@/data/admin/users";

export const crewColumns: ColumnDef<AdminUser>[] = [
  {
    id: "fullName",
    header: "Conductor",
    sortable: true,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="shrink-0 w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
          <CircleDot className="w-4 h-4 text-success" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate leading-tight">{row.fullName}</p>
          <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">@{row.username}</p>
        </div>
      </div>
    ),
  },
  {
    id: "email",
    header: "Contact",
    cell: ({ row }) => (
      <div className="space-y-0.5">
        <div className="flex items-center gap-1.5 text-sm text-foreground">
          <Mail className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
          <span className="truncate max-w-[180px]">{row.email}</span>
        </div>
        {row.phone && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone className="w-3 h-3 shrink-0" />
            {row.phone}
          </div>
        )}
      </div>
    ),
  },
  {
    id: "employeeId",
    header: "Employee ID",
    hideBelow: "md",
    cell: ({ row }) => (
      <span className="text-sm font-mono text-muted-foreground">
        {(row.profileData?.employee_id as string) || "—"}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    sortable: true,
    cell: ({ row }) => {
      const meta = USER_STATUS_CONFIG[row.status];
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${meta.bgColor} ${meta.color} ${meta.borderColor}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dotColor}`} />
          {meta.label}
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
      <span className="text-xs text-muted-foreground tabular-nums">{formatDateShort(row.createdAt)}</span>
    ),
  },
];
