import type { PassengerServicePermitResponse } from '@busmate/api-client-core';

/** Permit types as core-service defines them (PassengerServicePermitTypeEnum). */
export const PERMIT_TYPES = [
  { value: 'NORMAL', label: 'Normal', serviceClass: 'NORMAL' },
  { value: 'SEMI_LUXURY', label: 'Semi-luxury', serviceClass: 'SEMI_LUXURY' },
  { value: 'LUXURY', label: 'Luxury', serviceClass: 'LUXURY' },
  { value: 'EXTRA_LUXURY_NORMALWAY', label: 'Super luxury (normal road)', serviceClass: 'SUPER_LUXURY' },
  { value: 'EXTRA_LUXURY_HIGHWAY', label: 'Super luxury (expressway)', serviceClass: 'EXPRESSWAY_SUPER_LUXURY' },
] as const;

export function permitTypeLabel(type?: string): string {
  return PERMIT_TYPES.find((t) => t.value === type)?.label ?? type ?? '—';
}

/** The bus service class a permit type requires (mirrors PermitBusLinks.serviceClassFor). */
export function requiredServiceClass(permitType?: string): string | undefined {
  return PERMIT_TYPES.find((t) => t.value === permitType)?.serviceClass;
}

export type PermitTone = 'success' | 'warning' | 'destructive' | 'muted';

/**
 * What a permit's state means to a person. Recorded status values are core-service's shared
 * StatusEnum: inactive = suspended by MOT, cancelled = withdrawn. Expiry is derived.
 */
export function permitState(permit: Pick<PassengerServicePermitResponse, 'status' | 'expired' | 'expiryDate'>): {
  label: string;
  tone: PermitTone;
} {
  if (permit.status === 'cancelled') return { label: 'Withdrawn', tone: 'muted' };
  if (permit.status === 'inactive') return { label: 'Suspended', tone: 'warning' };
  if (permit.status === 'pending') return { label: 'Pending', tone: 'warning' };
  if (permit.expired) return { label: 'Expired', tone: 'destructive' };
  if (isExpiringSoon(permit.expiryDate)) return { label: 'Expiring soon', tone: 'warning' };
  return { label: 'Active', tone: 'success' };
}

export function isExpiringSoon(date?: string, days = 30): boolean {
  if (!date) return false;
  const diff = (new Date(date).getTime() - Date.now()) / 86_400_000;
  return diff >= 0 && diff <= days;
}

export const TONE_CLASSES: Record<PermitTone, string> = {
  success: 'bg-success/15 text-success border-success/20',
  warning: 'bg-warning/15 text-warning border-warning/20',
  destructive: 'bg-destructive/15 text-destructive border-destructive/20',
  muted: 'bg-muted text-muted-foreground border-border',
};

export function formatDate(date?: string | null): string {
  if (!date) return '—';
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Today's date as YYYY-MM-DD in the user's own time zone (toISOString would give UTC's). */
export function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
