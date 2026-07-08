// Types, config, and display helpers for the admin "User Management" section.
// Data itself comes from @/lib/api/adminUsers (real user-management API via api-gateway) —
// this file only shapes/labels/formats it for the UI.

import type { UserResponse } from '@/lib/api/adminUsers';
import { MANAGED_USER_TYPES, ACCOUNT_STATUSES } from '@/lib/api/adminUsers';
import type { ManagedUserType, AccountStatus } from '@/lib/api/adminUsers';

export type UserType = ManagedUserType;
export type UserStatus = AccountStatus;

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName?: string;
  username: string;
  phone?: string;
  userType: UserType;
  status: UserStatus;
  isEmailVerified: boolean;
  createdAt: string | null;
  lastLogin: string | null;
  profileData: Record<string, unknown> | null;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
}

export function toAdminUser(response: UserResponse): AdminUser {
  const fullName = response.fullName?.trim() || response.email || 'Unknown User';
  const [firstName, ...rest] = fullName.split(/\s+/);

  return {
    id: response.userId ?? '',
    email: response.email ?? '',
    fullName,
    firstName: firstName || fullName,
    lastName: rest.join(' ') || undefined,
    username: response.username ?? '',
    phone: response.phoneNumber ?? undefined,
    userType: (response.userType as UserType) ?? 'passenger',
    status: (response.accountStatus as UserStatus) ?? 'pending',
    isEmailVerified: !!response.isEmailVerified,
    createdAt: response.createdAt ?? null,
    lastLogin: response.lastLoginAt ?? null,
    profileData: response.profileData ?? null,
  };
}

// --- Config Maps ---

export const USER_TYPE_CONFIG: Record<UserType, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}> = {
  admin: { label: 'Admin', color: 'text-[hsl(var(--purple-700))]', bgColor: 'bg-[hsl(var(--purple-50))]', borderColor: 'border-[hsl(var(--purple-200))]', icon: 'Crown' },
  mot: { label: 'MOT Officer', color: 'text-primary', bgColor: 'bg-primary/10', borderColor: 'border-primary/20', icon: 'Shield' },
  timekeeper: { label: 'Timekeeper', color: 'text-[hsl(var(--cyan-700))]', bgColor: 'bg-[hsl(var(--cyan-50))]', borderColor: 'border-[hsl(var(--cyan-200))]', icon: 'Clock' },
  operator: { label: 'Operator', color: 'text-warning', bgColor: 'bg-warning/10', borderColor: 'border-warning/20', icon: 'Truck' },
  conductor: { label: 'Conductor', color: 'text-success', bgColor: 'bg-success/10', borderColor: 'border-success/20', icon: 'CircleDot' },
  passenger: { label: 'Passenger', color: 'text-[hsl(var(--purple-700))]', bgColor: 'bg-[hsl(var(--purple-50))]', borderColor: 'border-[hsl(var(--purple-200))]', icon: 'Users' },
};

export const USER_TYPE_ORDER: UserType[] = [...MANAGED_USER_TYPES];

// Prefer <StatusBadge status="active|inactive|pending" /> for inline status display.
export const USER_STATUS_CONFIG: Record<UserStatus, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
}> = {
  active:   { label: 'Active',   color: 'text-success',          bgColor: 'bg-success/10', borderColor: 'border-success/20', dotColor: 'bg-success' },
  inactive: { label: 'Inactive', color: 'text-destructive',      bgColor: 'bg-destructive/10', borderColor: 'border-destructive/20', dotColor: 'bg-destructive' },
  pending:  { label: 'Pending',  color: 'text-warning',          bgColor: 'bg-warning/10', borderColor: 'border-warning/20', dotColor: 'bg-warning' },
};

export const USER_STATUS_ORDER: UserStatus[] = [...ACCOUNT_STATUSES];

// --- Display / format helpers ---

export function getUserDisplayName(user: AdminUser): string {
  return user.fullName;
}

export function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-LK', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return 'Never';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${Math.floor(diffMonths / 12)}y ago`;
}

/** Turns a profileData key like "employee_id" into "Employee Id" for display. */
export function formatProfileFieldLabel(key: string): string {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
