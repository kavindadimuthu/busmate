'use client';

import { AlertTriangle, CalendarDays, FileText } from 'lucide-react';
import type { PassengerServicePermitResponse } from '@busmate/api-client-core';
import { SectionCard, ToneBadge } from '@/components/shared/form-primitives';
import { TONE_CLASSES, formatDate, permitState, permitTypeLabel } from '@/lib/permits';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground mt-0.5">{value}</dd>
    </div>
  );
}

/** Read-only facts of one permit, shared by the operator and MOT detail pages. */
export function PermitDetailsCard({ permit, showOperator = false }: { permit: PassengerServicePermitResponse; showOperator?: boolean }) {
  const state = permitState(permit);
  return (
    <SectionCard
      title={permit.permitNumber ?? "Permit"}
      icon={<FileText className="h-4 w-4 text-primary" />}
      actions={<ToneBadge className={TONE_CLASSES[state.tone]}>{state.label}</ToneBadge>}
    >
      {permit.statusReason && (permit.status === 'inactive' || permit.status === 'cancelled') && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 text-sm">
          <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
          <span>
            <strong>{permit.status === 'inactive' ? 'Suspended by the MOT' : 'Withdrawn'}:</strong> {permit.statusReason}
          </span>
        </div>
      )}
      {permit.expired && permit.status === 'active' && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          <CalendarDays className="h-4 w-4 mt-0.5 shrink-0" />
          This permit expired on {formatDate(permit.expiryDate)}. Record the renewed expiry date to keep receiving trips.
        </div>
      )}
      <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {showOperator && <Row label="Operator" value={permit.operatorName} />}
        <Row label="Route group" value={permit.routeGroupName} />
        <Row label="Service type" value={permitTypeLabel(permit.permitType)} />
        <Row label="Issued" value={formatDate(permit.issueDate)} />
        <Row label="Valid until" value={permit.expiryDate ? formatDate(permit.expiryDate) : 'No expiry'} />
        <Row label="Maximum buses" value={permit.maximumBusAssigned} />
        <Row label="Buses linked now" value={permit.activeBusCount ?? 0} />
        <Row label="Upcoming trips" value={permit.upcomingTripCount ?? '—'} />
        <Row label="Last updated" value={formatDate(permit.updatedAt)} />
      </dl>
    </SectionCard>
  );
}
