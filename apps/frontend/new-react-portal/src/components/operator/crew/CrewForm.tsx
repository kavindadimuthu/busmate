'use client';

import React, { useState } from 'react';
import { Save, User, Hash } from 'lucide-react';
import type { AdminUser } from '@/data/admin/users';
import { Field, SectionCard, inputClassFor } from '@/components/shared/form-primitives';

export interface CrewFormCoreValues {
  email?: string;
  password?: string;
  fullName: string;
  username: string;
  phoneNumber: string;
}

export interface CrewFormSubmitValues {
  core: CrewFormCoreValues;
  profileData: { employee_id: string; nic_number: string };
}

interface CrewFormProps {
  mode: 'create' | 'edit';
  conductor?: AdminUser | null;
  onSubmit: (data: CrewFormSubmitValues) => void;
  onCancel: () => void;
  loading?: boolean;
}

type Errors = Partial<Record<'email' | 'password' | 'fullName' | 'username' | 'employeeId' | 'nicNumber' | 'phoneNumber', string>>;

// Sri Lankan NIC: 9 digits + V/X (old) or 12 digits (new).
const NIC_PATTERN = /^(\d{9}[VvXx]|\d{12})$/;

/**
 * Create/edit form for conductor accounts, scoped to the logged-in operator. The operator link
 * (assign_operator_id) is never shown: the server sets it from the caller (INC-019).
 *
 * Inputs are plain elements inside module-level Field wrappers — an earlier version declared its
 * input component inside this component, which remounted every input on each keystroke and lost
 * focus after one character.
 */
export function CrewForm({ mode, conductor, onSubmit, onCancel, loading = false }: CrewFormProps) {
  const [values, setValues] = useState(() => ({
    email: conductor?.email ?? '',
    password: '',
    fullName: conductor?.fullName ?? '',
    username: conductor?.username ?? '',
    phoneNumber: conductor?.phone ?? '',
    employeeId: (conductor?.profileData?.employee_id as string) ?? '',
    nicNumber: (conductor?.profileData?.nic_number as string) ?? '',
  }));
  const [errors, setErrors] = useState<Errors>({});

  const set = (field: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (!values.fullName.trim()) e.fullName = 'Full name is required';
    if (!values.username.trim()) e.username = 'Username is required';
    if (!values.employeeId.trim()) e.employeeId = 'Employee ID is required';
    if (!values.nicNumber.trim()) e.nicNumber = 'NIC number is required';
    else if (!NIC_PATTERN.test(values.nicNumber.trim())) e.nicNumber = 'Use 9 digits + V/X, or 12 digits';
    if (values.phoneNumber && !/^\+?[\d\s-]{9,15}$/.test(values.phoneNumber)) e.phoneNumber = 'Enter a valid phone number';
    if (mode === 'create') {
      if (!values.email.trim()) e.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) e.email = 'Invalid email format';
      if (!values.password) e.password = 'Password is required';
      else if (values.password.length < 8) e.password = 'At least 8 characters';
    }
    return e;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    onSubmit({
      core: {
        ...(mode === 'create' ? { email: values.email.trim(), password: values.password } : {}),
        fullName: values.fullName.trim(),
        username: values.username.trim(),
        phoneNumber: values.phoneNumber.trim(),
      },
      profileData: { employee_id: values.employeeId.trim(), nic_number: values.nicNumber.trim().toUpperCase() },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <SectionCard title="Account details" icon={<User className="h-4 w-4 text-primary" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full name" required error={errors.fullName}>
            <input value={values.fullName} onChange={set('fullName')} disabled={loading} className={inputClassFor(errors.fullName)} />
          </Field>
          <Field label="Username" required error={errors.username}>
            <input value={values.username} onChange={set('username')} disabled={loading} className={inputClassFor(errors.username)} />
          </Field>
          <Field label="Email" required={mode === 'create'} error={errors.email} hint={mode === 'edit' ? 'The sign-in email cannot be changed' : undefined}>
            <input type="email" value={values.email} onChange={set('email')} disabled={loading || mode === 'edit'} className={inputClassFor(errors.email)} />
          </Field>
          {mode === 'create' && (
            <Field label="Initial password" required error={errors.password} hint="Share it with the conductor; they sign in to the conductor app with it">
              <input type="password" value={values.password} onChange={set('password')} disabled={loading} autoComplete="new-password" className={inputClassFor(errors.password)} />
            </Field>
          )}
          <Field label="Phone number" error={errors.phoneNumber}>
            <input value={values.phoneNumber} onChange={set('phoneNumber')} disabled={loading} placeholder="e.g. 0771234567" className={inputClassFor(errors.phoneNumber)} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Employment details" icon={<Hash className="h-4 w-4 text-primary" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Employee ID" required error={errors.employeeId}>
            <input value={values.employeeId} onChange={set('employeeId')} disabled={loading} className={inputClassFor(errors.employeeId)} />
          </Field>
          <Field label="NIC number" required error={errors.nicNumber}>
            <input value={values.nicNumber} onChange={set('nicNumber')} disabled={loading} placeholder="e.g. 199012345678" className={inputClassFor(errors.nicNumber)} />
          </Field>
        </div>
      </SectionCard>

      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={onCancel} disabled={loading} className="px-5 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
          <Save className="w-4 h-4" />
          {loading ? (mode === 'edit' ? 'Saving…' : 'Creating…') : mode === 'edit' ? 'Save changes' : 'Create conductor'}
        </button>
      </div>
    </form>
  );
}
