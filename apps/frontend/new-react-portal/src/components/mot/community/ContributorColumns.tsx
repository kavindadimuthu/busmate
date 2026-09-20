"use client";

import * as React from "react";
import type { ColumnDef } from "@busmate/ui";
import type { ContributorRow } from "@/hooks/mot/community/useContributors";

function formatDate(dateString?: string): string {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

const AFFILIATION_LABEL: Record<string, string> = {
  NONE: "None",
  OPERATOR_EMPLOYEE: "Works for an operator",
  BUS_OWNER: "Owns buses",
  OTHER: "Other link",
};

export const contributorColumns: ColumnDef<ContributorRow>[] = [
  {
    id: "name",
    header: "Applicant",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="text-sm font-semibold truncate leading-tight">{row.account?.fullName ?? "—"}</p>
        <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
          {row.account?.email ?? row.userId?.slice(0, 8)}
        </p>
      </div>
    ),
  },
  {
    id: "affiliation",
    header: "Declared affiliation",
    cell: ({ row }) =>
      row.affiliation && row.affiliation !== "NONE" ? (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-warning/10 text-warning border border-warning/20">
          {AFFILIATION_LABEL[row.affiliation] ?? row.affiliation}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">None</span>
      ),
  },
  {
    id: "corridors",
    header: "Corridors",
    hideBelow: "md",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.corridorRouteGroupIds?.length ? `${row.corridorRouteGroupIds.length} corridor(s)` : "—"}
      </span>
    ),
  },
  {
    id: "appliedAt",
    header: "Applied",
    sortable: true,
    hideBelow: "sm",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground tabular-nums">{formatDate(row.appliedAt)}</span>
    ),
  },
];
