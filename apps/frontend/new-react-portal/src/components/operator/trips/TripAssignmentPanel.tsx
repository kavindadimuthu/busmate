'use client';

import * as React from 'react';
import { Bus, Users, X, Loader2 } from 'lucide-react';
import type { TripResponse, BusResponse } from '@busmate/api-client-route';
import type { AdminUser } from '@/data/admin/users';
import { getUserDisplayName } from '@/data/admin/users';

interface TripAssignmentPanelProps {
  trip: TripResponse;
  myBuses: BusResponse[];
  myConductors: AdminUser[];
  actionLoading: boolean;
  onAssignBus: (busId: string) => void;
  onRemoveBus: () => void;
  onAssignConductor: (conductorId: string) => void;
  onRemoveConductor: () => void;
}

function AssignmentRow({
  icon,
  label,
  assignedLabel,
  isAssigned,
  options,
  actionLoading,
  onAssign,
  onRemove,
  emptyOptionsMessage,
}: {
  icon: React.ReactNode;
  label: string;
  assignedLabel: React.ReactNode;
  isAssigned: boolean;
  options: { value: string; label: string }[];
  actionLoading: boolean;
  onAssign: (value: string) => void;
  onRemove: () => void;
  emptyOptionsMessage: string;
}) {
  const [selected, setSelected] = React.useState('');

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-4 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2.5 sm:w-40 shrink-0">
        <div className="text-primary">{icon}</div>
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </div>

      {isAssigned ? (
        <div className="flex items-center justify-between flex-1 gap-3">
          <span className="text-sm text-foreground">{assignedLabel}</span>
          <button
            onClick={onRemove}
            disabled={actionLoading}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-destructive border border-destructive/20 rounded-lg hover:bg-destructive/10 transition-colors disabled:opacity-50"
          >
            <X className="w-3 h-3" />
            Unassign
          </button>
        </div>
      ) : options.length === 0 ? (
        <p className="text-sm text-muted-foreground/70 italic flex-1">{emptyOptionsMessage}</p>
      ) : (
        <div className="flex items-center gap-2 flex-1">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="flex-1 max-w-xs px-3 py-1.5 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
          >
            <option value="">Select…</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => selected && onAssign(selected)}
            disabled={!selected || actionLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {actionLoading && <Loader2 className="w-3 h-3 animate-spin" />}
            Assign
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Vehicle + crew (conductor) assignment for a trip owned by this operator. Bus options are
 * scoped to the operator's own active buses; conductor options to their own active conductors
 * (server-side ownership check exists for bus assignment via core-service; conductor ownership
 * is enforced only by this picker being scoped client-side - see useCrewManagement's known
 * limitation note, core-service has no cross-service validation against user-service).
 */
export function TripAssignmentPanel({
  trip,
  myBuses,
  myConductors,
  actionLoading,
  onAssignBus,
  onRemoveBus,
  onAssignConductor,
  onRemoveConductor,
}: TripAssignmentPanelProps) {
  const busOptions = myBuses.map((b) => ({ value: b.id!, label: `${b.plateNumber} — ${b.model ?? 'Unknown model'}` }));
  const conductorOptions = myConductors.map((c) => ({ value: c.id, label: getUserDisplayName(c) }));

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-border/50">
        <h3 className="text-sm font-semibold text-foreground">Vehicle & Crew Assignment</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Assign one of your own buses and conductors to this trip.</p>
      </div>
      <div className="px-6">
        <AssignmentRow
          icon={<Bus className="w-4 h-4" />}
          label="Vehicle"
          assignedLabel={
            <span className="font-medium">
              {trip.busPlateNumber} {trip.busModel ? `(${trip.busModel})` : ''}
            </span>
          }
          isAssigned={!!trip.busId}
          options={busOptions}
          actionLoading={actionLoading}
          onAssign={onAssignBus}
          onRemove={onRemoveBus}
          emptyOptionsMessage="No active buses available to assign."
        />
        <AssignmentRow
          icon={<Users className="w-4 h-4" />}
          label="Conductor"
          assignedLabel={
            <span className="font-medium">
              {myConductors.find((c) => c.id === trip.conductorId)
                ? getUserDisplayName(myConductors.find((c) => c.id === trip.conductorId)!)
                : `Conductor ${trip.conductorId?.slice(0, 8)}`}
            </span>
          }
          isAssigned={!!trip.conductorId}
          options={conductorOptions}
          actionLoading={actionLoading}
          onAssign={onAssignConductor}
          onRemove={onRemoveConductor}
          emptyOptionsMessage="No active conductors available to assign."
        />
      </div>
    </div>
  );
}
