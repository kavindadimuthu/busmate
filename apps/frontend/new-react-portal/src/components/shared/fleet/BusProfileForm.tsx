'use client';

import { useMemo, useState } from 'react';
import { Bus, Building2, LayoutGrid, Save, Sparkles } from 'lucide-react';
import type { BusResponse, OperatorResponse } from '@busmate/api-client-core';
import { ErrorBanner, Field, SectionCard, inputClassFor } from '@/components/shared/form-primitives';
import { FacilitiesPicker } from '@/components/shared/fleet/FacilitiesPicker';
import { SeatLayoutEditor, normalizeLayout, seatCount } from '@/components/shared/fleet/SeatLayoutEditor';
import type { SeatLayout } from '@/components/shared/fleet/SeatLayoutEditor';
import { SERVICE_CLASSES } from '@/lib/fleet';

/** Everything the form edits, in the shape both OperatorBusRequest and BusRequest share. */
export interface BusProfileValues {
  operatorId?: string;
  status?: string;
  ntcRegistrationNumber: string;
  plateNumber: string;
  capacity: number;
  model?: string;
  serviceClass: string;
  facilities: Record<string, boolean>;
  seatLayout: SeatLayout;
  manufactureYear?: number;
  chassisNumber?: string;
  engineNumber?: string;
}

interface BusProfileFormProps {
  bus?: BusResponse | null;
  /** MOT/admin: choose the owning operator and the registration status. Omit for operators. */
  operators?: OperatorResponse[];
  submitting: boolean;
  submitError: string | null;
  onSubmit: (values: BusProfileValues) => void;
  onCancel: () => void;
  /** Buses linked to permits cannot change class (the permits were matched to it). */
  serviceClassLocked?: boolean;
}

type Errors = Partial<Record<'operatorId' | 'ntcRegistrationNumber' | 'plateNumber' | 'manufactureYear' | 'seatLayout', string>>;

const THIS_YEAR = new Date().getFullYear();

export function BusProfileForm({ bus, operators, submitting, submitError, onSubmit, onCancel, serviceClassLocked }: BusProfileFormProps) {
  const staff = !!operators;
  const [values, setValues] = useState({
    operatorId: bus?.operatorId ?? '',
    status: bus?.status ?? 'active',
    ntcRegistrationNumber: bus?.ntcRegistrationNumber ?? '',
    plateNumber: bus?.plateNumber ?? '',
    model: bus?.model ?? '',
    serviceClass: bus?.serviceClass ?? 'NORMAL',
    manufactureYear: bus?.manufactureYear ? String(bus.manufactureYear) : '',
    chassisNumber: bus?.chassisNumber ?? '',
    engineNumber: bus?.engineNumber ?? '',
  });
  const [facilities, setFacilities] = useState<Record<string, boolean>>(
    () => (bus?.facilities && typeof bus.facilities === 'object' ? (bus.facilities as Record<string, boolean>) : { ac: false, wifi: false }),
  );
  const initialLayout = useMemo(() => (bus?.seatLayout as SeatLayout | undefined) ?? null, [bus]);
  const [layout, setLayout] = useState<SeatLayout>(() => normalizeLayout(initialLayout));
  const [errors, setErrors] = useState<Errors>({});

  const set = (field: keyof typeof values) => (value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const capacity = seatCount(layout);

  const validate = (): Errors => {
    const e: Errors = {};
    if (staff && !values.operatorId) e.operatorId = 'Choose the operator that owns the bus';
    if (!values.plateNumber.trim()) e.plateNumber = 'Plate number is required';
    if (!values.ntcRegistrationNumber.trim()) e.ntcRegistrationNumber = 'NTC registration number is required';
    if (values.manufactureYear) {
      const y = Number(values.manufactureYear);
      if (!Number.isInteger(y) || y < 1950 || y > THIS_YEAR + 1) e.manufactureYear = `Between 1950 and ${THIS_YEAR + 1}`;
    }
    if (capacity < 1) e.seatLayout = 'The layout needs at least one seat';
    if (capacity > 120) e.seatLayout = 'A bus cannot have more than 120 seats';
    return e;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    onSubmit({
      ...(staff ? { operatorId: values.operatorId, status: values.status } : {}),
      ntcRegistrationNumber: values.ntcRegistrationNumber.trim(),
      plateNumber: values.plateNumber.trim(),
      capacity,
      model: values.model.trim() || undefined,
      serviceClass: values.serviceClass,
      facilities,
      seatLayout: layout,
      manufactureYear: values.manufactureYear ? Number(values.manufactureYear) : undefined,
      chassisNumber: values.chassisNumber.trim() || undefined,
      engineNumber: values.engineNumber.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {submitError && <ErrorBanner message={submitError} />}

      {staff && (
        <SectionCard title="Ownership" icon={<Building2 className="h-4 w-4 text-primary" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Operator" required error={errors.operatorId}>
              <select value={values.operatorId} onChange={(e) => set('operatorId')(e.target.value)} className={inputClassFor(errors.operatorId)}>
                <option value="">Select an operator</option>
                {operators!.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Registration status" hint="Suspend or retire from the bus page to record a reason">
              <select value={values.status} onChange={(e) => set('status')(e.target.value)} className={inputClassFor()}>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Suspended</option>
                <option value="cancelled">Retired</option>
              </select>
            </Field>
          </div>
        </SectionCard>
      )}

      <SectionCard title="Vehicle" icon={<Bus className="h-4 w-4 text-primary" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Plate number" required error={errors.plateNumber}>
            <input value={values.plateNumber} onChange={(e) => set('plateNumber')(e.target.value)} placeholder="e.g. WP NB-4521" className={inputClassFor(errors.plateNumber)} />
          </Field>
          <Field label="NTC registration number" required error={errors.ntcRegistrationNumber}>
            <input value={values.ntcRegistrationNumber} onChange={(e) => set('ntcRegistrationNumber')(e.target.value)} placeholder="e.g. NTC-2026-0042" className={inputClassFor(errors.ntcRegistrationNumber)} />
          </Field>
          <Field label="Service class" required hint={serviceClassLocked ? 'End its permit links to change the class' : 'Decides the fare passengers pay'}>
            <select value={values.serviceClass} onChange={(e) => set('serviceClass')(e.target.value)} disabled={serviceClassLocked} className={inputClassFor()}>
              {SERVICE_CLASSES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Make and model">
            <input value={values.model} onChange={(e) => set('model')(e.target.value)} placeholder="e.g. Ashok Leyland Viking" className={inputClassFor()} />
          </Field>
          <Field label="Year of manufacture" error={errors.manufactureYear}>
            <input type="number" value={values.manufactureYear} onChange={(e) => set('manufactureYear')(e.target.value)} placeholder={String(THIS_YEAR)} className={inputClassFor(errors.manufactureYear)} />
          </Field>
          <Field label="Capacity" hint="Set by the seat layout below">
            <input value={`${capacity} seats`} readOnly className={inputClassFor()} aria-readonly />
          </Field>
          <Field label="Chassis number">
            <input value={values.chassisNumber} onChange={(e) => set('chassisNumber')(e.target.value)} className={inputClassFor()} />
          </Field>
          <Field label="Engine number">
            <input value={values.engineNumber} onChange={(e) => set('engineNumber')(e.target.value)} className={inputClassFor()} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Facilities" icon={<Sparkles className="h-4 w-4 text-primary" />}>
        <FacilitiesPicker value={facilities} onChange={setFacilities} />
      </SectionCard>

      <SectionCard title="Seat layout" icon={<LayoutGrid className="h-4 w-4 text-primary" />}>
        {errors.seatLayout && <p className="text-sm text-destructive">{errors.seatLayout}</p>}
        {bus && (
          <p className="text-xs text-warning">
            Changing the layout renumbers seats. Check that no upcoming booking is on a seat you remove.
          </p>
        )}
        <SeatLayoutEditor initial={initialLayout} onChange={setLayout} />
      </SectionCard>

      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={onCancel} disabled={submitting} className="px-5 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
          <Save className="w-4 h-4" />
          {submitting ? 'Saving…' : bus ? 'Save changes' : 'Register bus'}
        </button>
      </div>
    </form>
  );
}
