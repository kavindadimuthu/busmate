'use client';

import React from 'react';
import { Bus, CheckCircle, XCircle, Clock, XOctagon, Users, Building2 } from 'lucide-react';
import type { BusResponse } from '@busmate/api-client-core';

interface BusSummaryCardProps {
  bus: BusResponse;
}

const STATUS_META: Record<string, { label: string; classes: string; icon: React.ReactNode }> = {
  active:    { label: 'Active',    classes: 'bg-success/15 text-success border-success/20',       icon: <CheckCircle className="w-4 h-4" /> },
  inactive:  { label: 'Inactive',  classes: 'bg-destructive/10 text-destructive border-destructive/20', icon: <XCircle className="w-4 h-4" /> },
  pending:   { label: 'Pending',   classes: 'bg-warning/15 text-warning border-warning/20',        icon: <Clock className="w-4 h-4" /> },
  cancelled: { label: 'Cancelled', classes: 'bg-muted text-muted-foreground border-border',        icon: <XOctagon className="w-4 h-4" /> },
};

// Common facility keys used elsewhere in the app (MOT bus create forms, seed data) —
// core-service stores `facilities` as a free-form JSON object, so this is a display
// convenience, not an exhaustive schema.
const FACILITY_LABELS: Record<string, string> = {
  gps: 'GPS',
  wifi: 'WiFi',
  air_conditioning: 'Air Conditioning',
  wheelchair_accessible: 'Wheelchair Accessible',
  entertainment: 'Entertainment System',
  pushback_seats: 'Pushback Seats',
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-2 py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value}</span>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border/50 bg-muted">
        <div className="text-primary">{icon}</div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="px-5 py-1">{children}</div>
    </div>
  );
}

function formatDate(iso?: string) {
  if (!iso) return 'N/A';
  try { return new Date(iso).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return iso; }
}

export function BusSummaryCard({ bus }: BusSummaryCardProps) {
  const status = STATUS_META[bus.status ?? ''] ?? STATUS_META.pending;

  const facilities = (bus.facilities && typeof bus.facilities === 'object' ? bus.facilities : {}) as Record<string, unknown>;
  const enabledFacilities = Object.entries(facilities)
    .filter(([, v]) => v === true)
    .map(([k]) => FACILITY_LABELS[k] ?? k);

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Bus className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{bus.plateNumber || 'Unknown Plate'}</h1>
              <p className="text-sm text-muted-foreground font-mono mt-0.5">{bus.ntcRegistrationNumber || '—'}</p>
              <p className="text-sm text-muted-foreground mt-1">{bus.model || 'Model not specified'}</p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${status.classes}`}>
            {status.icon}
            {status.label}
          </span>
        </div>

        {/* Quick stats row */}
        <div className="mt-5 pt-5 border-t border-border/50 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-500" />
            <div>
              <p className="text-xs text-muted-foreground/70">Capacity</p>
              <p className="text-sm font-semibold text-foreground">{bus.capacity ?? 0} seats</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary/80" />
            <div>
              <p className="text-xs text-muted-foreground/70">Operator</p>
              <p className="text-sm font-semibold text-foreground">{bus.operatorName || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Vehicle Details" icon={<Bus className="w-4 h-4" />}>
          <InfoRow label="Model" value={bus.model || 'Not specified'} />
          <InfoRow label="Capacity" value={`${bus.capacity ?? 0} seats`} />
          <InfoRow label="NTC Registration No." value={<span className="font-mono text-xs">{bus.ntcRegistrationNumber}</span>} />
          <InfoRow label="Plate Number" value={<span className="font-mono text-xs">{bus.plateNumber}</span>} />
        </Section>

        <Section title="Record Information" icon={<Clock className="w-4 h-4" />}>
          <InfoRow label="Registered" value={formatDate(bus.createdAt)} />
          <InfoRow label="Last Updated" value={formatDate(bus.updatedAt)} />
        </Section>
      </div>

      {/* Facilities */}
      {enabledFacilities.length > 0 && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Facilities & Amenities</h3>
          <div className="flex flex-wrap gap-2">
            {enabledFacilities.map((f) => (
              <span
                key={f}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary text-xs rounded-full"
              >
                <CheckCircle className="w-3 h-3" />
                {f}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
