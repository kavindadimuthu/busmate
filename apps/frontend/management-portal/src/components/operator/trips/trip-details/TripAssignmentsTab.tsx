'use client';

import {
  Bus,
  User,
  FileText,
  Phone,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
} from 'lucide-react';
import type { OperatorTrip, OperatorTripBus, OperatorTripStaff, OperatorTripPermit } from '@/data/operator/trips';

interface TripAssignmentsTabProps {
  trip: OperatorTrip;
  bus?: OperatorTripBus | null;
  staff?: OperatorTripStaff | null;
  permit?: OperatorTripPermit | null;
}

function AssignedBadge({ assigned }: { assigned: boolean }) {
  return assigned ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
      <CheckCircle className="w-3 h-3" />
      Assigned
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
      <XCircle className="w-3 h-3" />
      Not Assigned
    </span>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/30 last:border-0">
      <div className="text-muted-foreground/70 mt-0.5 shrink-0">{icon}</div>
      <div className="flex-1 flex justify-between gap-4">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-medium text-foreground text-right">{value}</span>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  assigned,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  assigned: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-muted-foreground">{icon}</div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        <AssignedBadge assigned={assigned} />
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

export function TripAssignmentsTab({ trip, bus, staff, permit }: TripAssignmentsTabProps) {
  const busAssigned = Boolean(trip.busId);
  const driverAssigned = Boolean(staff?.driverId ?? trip.driverName);
  const conductorAssigned = Boolean(staff?.conductorId ?? trip.conductorName);
  const permitAssigned = Boolean(trip.passengerServicePermitId);

  // Summary
  const allAssigned = busAssigned && driverAssigned && conductorAssigned && permitAssigned;

  return (
    <div className="space-y-6">
      {/* Summary overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Permit', assigned: permitAssigned, icon: <FileText className="w-5 h-5" /> },
          { label: 'Bus',    assigned: busAssigned,    icon: <Bus className="w-5 h-5" /> },
          { label: 'Driver', assigned: driverAssigned, icon: <User className="w-5 h-5" /> },
          { label: 'Conductor', assigned: conductorAssigned, icon: <User className="w-5 h-5" /> },
        ].map(({ label, assigned, icon }) => (
          <div
            key={label}
            className={`rounded-xl border-2 p-4 text-center transition-colors ${
              assigned ? 'bg-success/10 border-success/20' : 'bg-destructive/10 border-destructive/20'
            }`}
          >
            <div className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
              assigned ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive/80'
            }`}>{icon}</div>
            <p className="text-xs font-semibold text-foreground/80">{label}</p>
            <p className={`text-xs mt-0.5 ${assigned ? 'text-success' : 'text-destructive/80'}`}>
              {assigned ? 'Assigned' : 'Missing'}
            </p>
          </div>
        ))}
      </div>

      {!allAssigned && (
        <div className="flex items-start gap-2 bg-warning/10 border border-warning/20 rounded-xl px-4 py-3 text-sm text-warning">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-warning/80" />
          <p>
            One or more assignments are missing. Contact your operations team if you believe this is an error.
            Assignment changes are managed by the Ministry of Transport or your operations team.
          </p>
        </div>
      )}

      {/* Passenger Service Permit */}
      <SectionCard
        title="Passenger Service Permit"
        icon={<Shield className="w-5 h-5" />}
        assigned={permitAssigned}
      >
        {permitAssigned ? (
          <div className="space-y-0">
            <InfoRow icon={<FileText className="w-4 h-4" />} label="Permit Number" value={trip.permitNumber} />
            {permit && (
              <>
                <InfoRow icon={<CreditCard className="w-4 h-4" />} label="Permit ID" value={permit.id} />
                <InfoRow icon={<CheckCircle className="w-4 h-4" />} label="Status" value={permit.status} />
                <InfoRow icon={<FileText className="w-4 h-4" />} label="Expiry Date" value={permit.expiryDate} />
              </>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground/70">No permit assigned to this trip.</p>
        )}
      </SectionCard>

      {/* Bus assignment */}
      <SectionCard
        title="Bus Assignment"
        icon={<Bus className="w-5 h-5" />}
        assigned={busAssigned}
      >
        {busAssigned ? (
          <div className="space-y-0">
            <InfoRow icon={<Bus className="w-4 h-4" />} label="Registration" value={trip.busRegistrationNumber ?? '—'} />
            {bus ? (
              <>
                <InfoRow icon={<CreditCard className="w-4 h-4" />} label="Plate Number" value={bus.plateNumber} />
                <InfoRow icon={<FileText className="w-4 h-4" />} label="Make / Model" value={`${bus.make} ${bus.model}`} />
                <InfoRow icon={<FileText className="w-4 h-4" />} label="Service Type" value={bus.serviceType} />
                <InfoRow icon={<FileText className="w-4 h-4" />} label="Total Seats" value={String(bus.totalSeats)} />
                <InfoRow icon={<FileText className="w-4 h-4" />} label="Colour" value={bus.colour} />
                {/* Facilities */}
                <div className="pt-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Facilities</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(bus.facilities).map(([key, val]) =>
                      val ? (
                        <span
                          key={key}
                          className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize"
                        >
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      ) : null
                    )}
                  </div>
                </div>
              </>
            ) : (
              <InfoRow icon={<FileText className="w-4 h-4" />} label="Service Type" value={trip.busServiceType ?? '—'} />
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground/70">No bus assigned to this trip.</p>
        )}
      </SectionCard>

      {/* Staff */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Driver */}
        <SectionCard
          title="Driver"
          icon={<User className="w-5 h-5" />}
          assigned={driverAssigned}
        >
          {driverAssigned ? (
            <div className="space-y-0">
              <InfoRow icon={<User className="w-4 h-4" />} label="Name" value={staff?.driverName ?? trip.driverName ?? '—'} />
              {staff?.driverLicense && (
                <InfoRow icon={<CreditCard className="w-4 h-4" />} label="License" value={staff.driverLicense} />
              )}
              {staff?.driverPhone && (
                <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={staff.driverPhone} />
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground/70">No driver assigned to this trip.</p>
          )}
        </SectionCard>

        {/* Conductor */}
        <SectionCard
          title="Conductor"
          icon={<User className="w-5 h-5" />}
          assigned={conductorAssigned}
        >
          {conductorAssigned ? (
            <div className="space-y-0">
              <InfoRow icon={<User className="w-4 h-4" />} label="Name" value={staff?.conductorName ?? trip.conductorName ?? '—'} />
              {staff?.conductorPhone && (
                <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={staff.conductorPhone} />
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground/70">No conductor assigned to this trip.</p>
          )}
        </SectionCard>
      </div>

      {/* Read-only note */}
      <div className="flex items-start gap-2 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 text-sm text-primary">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-primary/80" />
        <p>
          Assignments are managed by the Ministry of Transport and your operations team.
          This view is read-only.
        </p>
      </div>
    </div>
  );
}
