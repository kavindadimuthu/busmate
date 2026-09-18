"use client";

import type { ColumnDef } from "@busmate/ui";
import type { BusResponse } from "@busmate/api-client-core";
import { ToneBadge } from "@/components/shared/form-primitives";
import { BusCoverImage } from "@/components/shared/fleet/BusPhotoGallery";
import { busState, serviceClassLabel } from "@/lib/fleet";
import { TONE_CLASSES } from "@/lib/permits";

export const fleetColumns: ColumnDef<BusResponse>[] = [
  {
    id: "plateNumber",
    header: "Plate / Reg.",
    sortable: true,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <BusCoverImage busId={row.id} coverPhotoId={row.coverPhotoId} className="shrink-0 w-12 h-9 rounded-md" />
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate leading-tight">{row.plateNumber || "Unknown Plate"}</p>
          <p className="text-[11px] text-muted-foreground font-mono leading-tight mt-0.5 truncate">{row.ntcRegistrationNumber || "—"}</p>
        </div>
      </div>
    ),
  },
  {
    id: "model",
    header: "Model",
    sortable: true,
    cell: ({ row }) => <span className="text-sm text-foreground">{row.model || "Not specified"}</span>,
  },
  {
    id: "serviceClass",
    header: "Class",
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{serviceClassLabel(row.serviceClass)}</span>,
  },
  {
    id: "capacity",
    header: "Seats",
    sortable: true,
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.capacity ?? 0}</span>,
  },
  {
    id: "status",
    header: "Status",
    sortable: true,
    cell: ({ row }) => {
      const state = busState(row);
      return <ToneBadge className={TONE_CLASSES[state.tone]}>{state.label}</ToneBadge>;
    },
  },
];
