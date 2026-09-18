'use client';

import { AlertTriangle, Bus, Link2, Sparkles, LayoutGrid } from 'lucide-react';
import type { BusMediaResponse, BusPassengerServicePermitAssignmentResponse, BusResponse } from '@busmate/api-client-core';
import { SectionCard, ToneBadge } from '@/components/shared/form-primitives';
import { BusAvailabilityCard } from '@/components/shared/fleet/BusAvailabilityCard';
import { BusCoverImage, BusPhotoGallery } from '@/components/shared/fleet/BusPhotoGallery';
import { BusDocumentsPanel } from '@/components/shared/fleet/BusDocumentsPanel';
import { SeatMapView } from '@/components/shared/fleet/SeatMapView';
import type { SeatLayout } from '@/components/shared/fleet/SeatLayoutEditor';
import { busState, facilityLabel, serviceClassLabel } from '@/lib/fleet';
import { TONE_CLASSES, formatDate } from '@/lib/permits';

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground mt-0.5">{value || '—'}</dd>
    </div>
  );
}

interface BusProfileViewProps {
  bus: BusResponse;
  photos: BusMediaResponse[];
  documents: BusMediaResponse[];
  links: BusPassengerServicePermitAssignmentResponse[];
  canEdit: boolean;
  showOperator?: boolean;
  onChanged: () => void;
  onOpenPermit?: (permitId: string) => void;
}

/** Everything about one bus, for its owner and for MOT (INC-018). */
export function BusProfileView({ bus, photos, documents, links, canEdit, showOperator, onChanged, onOpenPermit }: BusProfileViewProps) {
  const state = busState(bus);
  const facilities = Object.entries((bus.facilities as Record<string, boolean>) ?? {}).filter(([, on]) => on);
  const layout = bus.seatLayout as SeatLayout | undefined;
  const blocked = layout?.blockedSeats?.length ?? 0;
  const activeLinks = links.filter((l) => l.inForce);
  const retired = bus.status === 'cancelled';

  return (
    <div className="space-y-6">
      {bus.statusReason && (bus.status === 'inactive' || retired) && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 text-sm">
          <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
          <span><strong>{retired ? 'Retired' : 'Suspended by the MOT'}:</strong> {bus.statusReason}</span>
        </div>
      )}

      <section className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <BusCoverImage busId={bus.id} coverPhotoId={bus.coverPhotoId} className="md:w-72 h-48 md:h-auto shrink-0" />
          <div className="p-6 flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Bus className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">{bus.plateNumber}</h2>
              <ToneBadge className={TONE_CLASSES[state.tone]}>{state.label}</ToneBadge>
              <span className="text-sm text-muted-foreground">{serviceClassLabel(bus.serviceClass)}</span>
            </div>
            <dl className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {showOperator && <Fact label="Operator" value={bus.operatorName} />}
              <Fact label="NTC registration" value={bus.ntcRegistrationNumber} />
              <Fact label="Make and model" value={bus.model} />
              <Fact label="Year" value={bus.manufactureYear} />
              <Fact label="Seats" value={`${bus.capacity}${blocked ? ` (${blocked} not for sale)` : ''}`} />
              <Fact label="Chassis number" value={bus.chassisNumber} />
              <Fact label="Engine number" value={bus.engineNumber} />
              <Fact label="Photos · documents" value={`${bus.photoCount ?? 0} · ${bus.documentCount ?? 0}`} />
              <Fact label="Last updated" value={formatDate(bus.updatedAt)} />
            </dl>
          </div>
        </div>
      </section>

      <BusAvailabilityCard bus={bus} canEdit={canEdit && !retired} onChanged={onChanged} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title={`Seat layout — ${layout?.layoutName ?? `${bus.capacity} seats`}`} icon={<LayoutGrid className="h-4 w-4 text-primary" />}>
          <SeatMapView layout={layout} />
        </SectionCard>
        <div className="space-y-6">
          <SectionCard title="Facilities" icon={<Sparkles className="h-4 w-4 text-primary" />}>
            {facilities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No facilities recorded.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {facilities.map(([key]) => (
                  <span key={key} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs">{facilityLabel(key)}</span>
                ))}
              </div>
            )}
          </SectionCard>
          <SectionCard title={`Permits (${activeLinks.length})`} icon={<Link2 className="h-4 w-4 text-primary" />}>
            {activeLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Not authorised under any permit yet{canEdit ? ' — link it from a permit page, under Service Permits' : ''}. It cannot be given trips until it is.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {activeLinks.map((l) => (
                  <li key={l.id} className="text-sm">
                    <button type="button" onClick={() => l.passengerServicePermitId && onOpenPermit?.(l.passengerServicePermitId)}
                      className="font-medium text-primary hover:underline">{l.permitNumber}</button>
                    <span className="text-muted-foreground"> · since {formatDate(l.startDate)}</span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>

      <BusPhotoGallery busId={bus.id!} photos={photos} canEdit={canEdit && !retired} onChanged={onChanged} />
      <BusDocumentsPanel busId={bus.id!} documents={documents} canEdit={canEdit && !retired} onChanged={onChanged} />
    </div>
  );
}
