'use client';

import { useEffect, useState } from 'react';
import { FileText, Save } from 'lucide-react';
import { RouteManagementService } from '@busmate/api-client-core';
import type { OperatorPermitRequest, PassengerServicePermitResponse, RouteGroupResponse } from '@busmate/api-client-core';
import { ErrorBanner, Field, SectionCard, inputClassFor } from '@/components/shared/form-primitives';
import { PERMIT_TYPES, localToday } from '@/lib/permits';

interface OperatorPermitFormProps {
  permit?: PassengerServicePermitResponse | null;
  submitting: boolean;
  submitError: string | null;
  onSubmit: (request: OperatorPermitRequest) => void;
  onCancel: () => void;
}

type Errors = Partial<Record<keyof OperatorPermitRequest, string>>;

const today = localToday;

/** Create/edit a permit the operator already holds (INC-017). */
export function OperatorPermitForm({ permit, submitting, submitError, onSubmit, onCancel }: OperatorPermitFormProps) {
  const [routeGroups, setRouteGroups] = useState<RouteGroupResponse[]>([]);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [values, setValues] = useState({
    permitNumber: permit?.permitNumber ?? '',
    routeGroupId: permit?.routeGroupId ?? '',
    permitType: permit?.permitType ?? 'NORMAL',
    issueDate: permit?.issueDate ?? today(),
    expiryDate: permit?.expiryDate ?? '',
    maximumBusAssigned: permit?.maximumBusAssigned ? String(permit.maximumBusAssigned) : '1',
  });
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    RouteManagementService.getAllRouteGroupsAsList()
      .then((groups) => setRouteGroups([...groups].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))))
      .catch(() => setGroupsError('Could not load route groups.'));
  }, []);

  const set = (field: keyof typeof values) => (value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (!values.permitNumber.trim()) e.permitNumber = 'Permit number is required';
    if (!values.routeGroupId) e.routeGroupId = 'Choose the route group the permit covers';
    if (!values.issueDate) e.issueDate = 'Issue date is required';
    if (values.expiryDate && values.issueDate && values.expiryDate <= values.issueDate) {
      e.expiryDate = 'Expiry must be after the issue date';
    }
    const max = Number(values.maximumBusAssigned);
    if (!Number.isInteger(max) || max < 1) e.maximumBusAssigned = 'At least 1';
    else if (permit?.activeBusCount && max < permit.activeBusCount) {
      e.maximumBusAssigned = `${permit.activeBusCount} bus(es) are linked; end some links first`;
    }
    return e;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    onSubmit({
      permitNumber: values.permitNumber.trim(),
      routeGroupId: values.routeGroupId,
      permitType: values.permitType,
      issueDate: values.issueDate,
      expiryDate: values.expiryDate || undefined,
      maximumBusAssigned: Number(values.maximumBusAssigned),
    });
  };

  const typeChangeLocked = !!permit && (permit.activeBusCount ?? 0) > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {submitError && <ErrorBanner message={submitError} />}
      {groupsError && <ErrorBanner message={groupsError} />}

      <SectionCard title="Permit" icon={<FileText className="h-4 w-4 text-primary" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Permit number" required error={errors.permitNumber} hint="Exactly as printed on the permit">
            <input
              value={values.permitNumber}
              onChange={(e) => set('permitNumber')(e.target.value)}
              placeholder="e.g. PVT-SUW-2026-002"
              className={inputClassFor(errors.permitNumber)}
            />
          </Field>
          <Field label="Route group" required error={errors.routeGroupId}>
            <select
              value={values.routeGroupId}
              onChange={(e) => set('routeGroupId')(e.target.value)}
              className={inputClassFor(errors.routeGroupId)}
            >
              <option value="">{routeGroups.length ? 'Select a route group' : 'Loading…'}</option>
              {routeGroups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </Field>
          <Field
            label="Service type"
            required
            hint={typeChangeLocked ? 'End the linked buses before changing the type' : 'Buses linked to this permit must be of this class'}
          >
            <select
              value={values.permitType}
              onChange={(e) => set('permitType')(e.target.value)}
              disabled={typeChangeLocked}
              className={inputClassFor()}
            >
              {PERMIT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Maximum buses" required error={errors.maximumBusAssigned} hint="How many buses the permit authorises">
            <input
              type="number"
              min={1}
              value={values.maximumBusAssigned}
              onChange={(e) => set('maximumBusAssigned')(e.target.value)}
              className={inputClassFor(errors.maximumBusAssigned)}
            />
          </Field>
          <Field label="Issue date" required error={errors.issueDate}>
            <input type="date" value={values.issueDate} onChange={(e) => set('issueDate')(e.target.value)} className={inputClassFor(errors.issueDate)} />
          </Field>
          <Field label="Expiry date" error={errors.expiryDate} hint="Leave empty if the permit does not expire">
            <input type="date" value={values.expiryDate} onChange={(e) => set('expiryDate')(e.target.value)} className={inputClassFor(errors.expiryDate)} />
          </Field>
        </div>
      </SectionCard>

      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={onCancel} disabled={submitting} className="px-5 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
          <Save className="w-4 h-4" />
          {submitting ? 'Saving…' : permit ? 'Save changes' : 'Add permit'}
        </button>
      </div>
    </form>
  );
}
