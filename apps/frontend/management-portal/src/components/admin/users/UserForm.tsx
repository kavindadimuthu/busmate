'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  AtSign,
  KeyRound,
  Shield,
} from 'lucide-react';
import {
  USER_TYPE_CONFIG,
  USER_STATUS_CONFIG,
  formatProfileFieldLabel,
} from '@/data/admin/users';
import type { AdminUser, UserType } from '@/data/admin/users';
import { MANAGED_USER_TYPES, REQUIRED_PROFILE_FIELDS } from '@/lib/api/adminUsers';

export interface UserFormCoreValues {
  email?: string;
  password?: string;
  fullName: string;
  username: string;
  phoneNumber: string;
  userType?: UserType;
}

export interface UserFormSubmitValues {
  core: UserFormCoreValues;
  profileData: Record<string, string>;
}

interface UserFormProps {
  mode: 'create' | 'edit';
  user?: AdminUser | null;
  /** Pre-selects the user type in create mode (e.g. when adding from within a tab). */
  defaultUserType?: UserType;
  onSubmit: (data: UserFormSubmitValues) => void;
  onCancel: () => void;
  loading?: boolean;
}

interface FormErrors {
  [key: string]: string;
}

export function UserForm({
  mode,
  user,
  defaultUserType,
  onSubmit,
  onCancel,
  loading = false,
}: UserFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userType, setUserType] = useState<UserType>(defaultUserType ?? 'mot');
  const [profileValues, setProfileValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (mode === 'edit' && user) {
      setFullName(user.fullName);
      setUsername(user.username);
      setPhoneNumber(user.phone ?? '');
      setEmail(user.email);
      setUserType(user.userType);
      const initialProfile: Record<string, string> = {};
      Object.entries(user.profileData ?? {}).forEach(([key, value]) => {
        initialProfile[key] = String(value ?? '');
      });
      setProfileValues(initialProfile);
    }
  }, [mode, user]);

  const requiredProfileFields = REQUIRED_PROFILE_FIELDS[userType] ?? [];

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!username.trim()) newErrors.username = 'Username is required';

    if (mode === 'create') {
      if (!email.trim()) newErrors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email format';
      if (!password) newErrors.password = 'Password is required';
      else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';

      requiredProfileFields.forEach((field) => {
        if (!profileValues[field]?.trim()) {
          newErrors[`profile.${field}`] = `${formatProfileFieldLabel(field)} is required`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      core: {
        ...(mode === 'create' ? { email, password, userType } : {}),
        fullName,
        username,
        phoneNumber,
      },
      profileData: profileValues,
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
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70">
            {icon}
          </div>
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

  const displayName = fullName || (mode === 'edit' ? user?.fullName : '') || 'New User';
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          {mode === 'edit' ? 'Back to User' : 'Back to Users'}
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-foreground/80 bg-card border border-border rounded-lg hover:bg-muted disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Saving...
              </span>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {mode === 'create' ? 'Create User' : 'Save Changes'}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Information */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Account Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Full Name"
                value={fullName}
                onChange={setFullName}
                error={errors.fullName}
                placeholder="Enter full name"
                required
                icon={<User className="h-3.5 w-3.5" />}
              />
              <InputField
                label="Username"
                value={username}
                onChange={setUsername}
                error={errors.username}
                placeholder="Enter username"
                required
                icon={<AtSign className="h-3.5 w-3.5" />}
              />
              <InputField
                label="Email"
                value={email}
                onChange={setEmail}
                error={errors.email}
                type="email"
                placeholder="user@example.com"
                required={mode === 'create'}
                disabled={mode === 'edit'}
                icon={<Mail className="h-3.5 w-3.5" />}
              />
              <InputField
                label="Phone"
                value={phoneNumber}
                onChange={setPhoneNumber}
                placeholder="+94 XX XXX XXXX"
                icon={<Phone className="h-3.5 w-3.5" />}
              />
              {mode === 'create' && (
                <div className="sm:col-span-2">
                  <InputField
                    label="Password"
                    value={password}
                    onChange={setPassword}
                    error={errors.password}
                    type="password"
                    placeholder="At least 8 characters"
                    required
                    icon={<KeyRound className="h-3.5 w-3.5" />}
                  />
                </div>
              )}
            </div>
            {mode === 'edit' && (
              <p className="text-xs text-muted-foreground mt-3">
                Email and role can&apos;t be changed here — they&apos;re tied to the account&apos;s identity.
              </p>
            )}
          </div>

          {/* Role */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Role
            </h3>
            {mode === 'create' ? (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  User Type <span className="text-destructive/80">*</span>
                </label>
                <select
                  value={userType}
                  onChange={(e) => {
                    setUserType(e.target.value as UserType);
                    setProfileValues({});
                  }}
                  disabled={loading}
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-card disabled:bg-muted sm:max-w-xs"
                >
                  {MANAGED_USER_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {USER_TYPE_CONFIG[type].label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${USER_TYPE_CONFIG[userType].bgColor} ${USER_TYPE_CONFIG[userType].color} ${USER_TYPE_CONFIG[userType].borderColor}`}>
                {USER_TYPE_CONFIG[userType].label}
              </span>
            )}
          </div>

          {/* Type-specific profile fields */}
          {(requiredProfileFields.length > 0 || Object.keys(profileValues).length > 0) && (
            <div className="bg-card rounded-xl border border-border shadow-sm p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                {USER_TYPE_CONFIG[userType].label} Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {requiredProfileFields.map((field) => (
                  <InputField
                    key={field}
                    label={formatProfileFieldLabel(field)}
                    value={profileValues[field] ?? ''}
                    onChange={(val) => setProfileValues((prev) => ({ ...prev, [field]: val }))}
                    error={errors[`profile.${field}`]}
                    placeholder={formatProfileFieldLabel(field)}
                    required={mode === 'create'}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Preview */}
        <div>
          <div className="bg-card rounded-xl border border-border shadow-sm p-6 sticky top-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Preview</h3>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-lg font-bold mb-3">
                {initials}
              </div>
              <p className="font-semibold text-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{email || 'email@example.com'}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${USER_TYPE_CONFIG[userType].bgColor} ${USER_TYPE_CONFIG[userType].color} ${USER_TYPE_CONFIG[userType].borderColor}`}>
                  {USER_TYPE_CONFIG[userType].label}
                </span>
                {mode === 'edit' && user && (
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${USER_STATUS_CONFIG[user.status].bgColor} ${USER_STATUS_CONFIG[user.status].color} ${USER_STATUS_CONFIG[user.status].borderColor}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${USER_STATUS_CONFIG[user.status].dotColor}`} />
                    {USER_STATUS_CONFIG[user.status].label}
                  </span>
                )}
              </div>
              {phoneNumber && (
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {phoneNumber}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
