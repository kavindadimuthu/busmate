'use client';

import React, { useState, useEffect } from 'react';
import { Save, User, Mail, Phone, AtSign, KeyRound, Hash, CreditCard } from 'lucide-react';
import type { AdminUser } from '@/data/admin/users';

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

interface FormErrors {
  [key: string]: string;
}

/**
 * Create/edit form for conductor accounts, scoped to the logged-in operator.
 * assign_operator_id is never shown here — it's set automatically by the page (create
 * only; it can't change on edit) to the operator's own core-service Operator.id.
 */
export function CrewForm({ mode, conductor, onSubmit, onCancel, loading = false }: CrewFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [nicNumber, setNicNumber] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (mode === 'edit' && conductor) {
      setFullName(conductor.fullName);
      setUsername(conductor.username);
      setPhoneNumber(conductor.phone ?? '');
      setEmail(conductor.email);
      setEmployeeId((conductor.profileData?.employee_id as string) ?? '');
      setNicNumber((conductor.profileData?.nic_number as string) ?? '');
    }
  }, [mode, conductor]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!username.trim()) newErrors.username = 'Username is required';
    if (!employeeId.trim()) newErrors.employeeId = 'Employee ID is required';
    if (!nicNumber.trim()) newErrors.nicNumber = 'NIC number is required';

    if (mode === 'create') {
      if (!email.trim()) newErrors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email format';
      if (!password) newErrors.password = 'Password is required';
      else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      core: {
        ...(mode === 'create' ? { email, password } : {}),
        fullName,
        username,
        phoneNumber,
      },
      profileData: { employee_id: employeeId, nic_number: nicNumber },
    });
  };

  const InputField = ({
    label,
    value,
    onChange,
    error,
    type = 'text',
    placeholder,
    required = false,
    disabled = false,
    icon,
  }: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    error?: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
  }) => (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">
        {label} {required && <span className="text-destructive/80">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70">{icon}</div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || loading}
          className={`w-full ${icon ? 'pl-10' : 'pl-3'} pr-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-card disabled:bg-muted disabled:text-muted-foreground ${
            error ? 'border-destructive/30 bg-destructive/10' : 'border-border'
          }`}
        />
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          Account Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Full Name" value={fullName} onChange={setFullName} error={errors.fullName} required icon={<User className="h-4 w-4" />} />
          <InputField label="Username" value={username} onChange={setUsername} error={errors.username} required icon={<AtSign className="h-4 w-4" />} />
          <InputField
            label="Email"
            value={email}
            onChange={setEmail}
            error={errors.email}
            type="email"
            required={mode === 'create'}
            disabled={mode === 'edit'}
            icon={<Mail className="h-4 w-4" />}
          />
          {mode === 'create' && (
            <InputField label="Password" value={password} onChange={setPassword} error={errors.password} type="password" required icon={<KeyRound className="h-4 w-4" />} />
          )}
          <InputField label="Phone Number" value={phoneNumber} onChange={setPhoneNumber} error={errors.phoneNumber} icon={<Phone className="h-4 w-4" />} />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Hash className="h-4 w-4 text-primary" />
          Employment Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Employee ID" value={employeeId} onChange={setEmployeeId} error={errors.employeeId} required icon={<Hash className="h-4 w-4" />} />
          <InputField label="NIC Number" value={nicNumber} onChange={setNicNumber} error={errors.nicNumber} required icon={<CreditCard className="h-4 w-4" />} />
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-2 border border-border text-foreground/80 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {loading ? (mode === 'edit' ? 'Saving…' : 'Creating…') : mode === 'edit' ? 'Save Changes' : 'Create Conductor'}
        </button>
      </div>
    </form>
  );
}
