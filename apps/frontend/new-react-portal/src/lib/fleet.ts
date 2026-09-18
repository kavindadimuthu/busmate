import type { BusResponse } from '@busmate/api-client-core';

/** ServiceClassEnum in core-service: the fare tier a bus is charged at. */
export const SERVICE_CLASSES = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'SEMI_LUXURY', label: 'Semi-luxury' },
  { value: 'LUXURY', label: 'Luxury' },
  { value: 'SUPER_LUXURY', label: 'Super luxury' },
  { value: 'EXPRESSWAY_SUPER_LUXURY', label: 'Expressway super luxury' },
] as const;

export function serviceClassLabel(value?: string): string {
  return SERVICE_CLASSES.find((c) => c.value === value)?.label ?? value ?? '—';
}

/**
 * Facilities are stored as { key: boolean } on the bus. These are the ones offered by default;
 * an operator may add their own keys too. The first four match the demo seed's keys.
 */
export const FACILITY_CATALOG: { key: string; label: string }[] = [
  { key: 'ac', label: 'Air conditioning' },
  { key: 'wifi', label: 'Wi-Fi' },
  { key: 'charging_ports', label: 'Charging ports' },
  { key: 'reclining_seats', label: 'Reclining seats' },
  { key: 'cctv', label: 'CCTV' },
  { key: 'gps', label: 'GPS tracking' },
  { key: 'tv_screens', label: 'TV screens' },
  { key: 'audio_system', label: 'Audio system' },
  { key: 'reading_lights', label: 'Reading lights' },
  { key: 'seat_belts', label: 'Seat belts' },
  { key: 'wheelchair_accessible', label: 'Wheelchair accessible' },
  { key: 'luggage_rack', label: 'Luggage rack' },
  { key: 'first_aid_kit', label: 'First-aid kit' },
  { key: 'fire_extinguisher', label: 'Fire extinguisher' },
];

export function facilityLabel(key: string): string {
  return FACILITY_CATALOG.find((f) => f.key === key)?.label ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export const AVAILABILITY = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'UNDER_MAINTENANCE', label: 'Under maintenance' },
  { value: 'OFF_ROAD', label: 'Off the road' },
] as const;

export const DOCUMENT_TYPES = [
  { value: 'REGISTRATION_CERTIFICATE', label: 'Registration certificate' },
  { value: 'REVENUE_LICENCE', label: 'Revenue licence' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'FITNESS_CERTIFICATE', label: 'Fitness certificate' },
  { value: 'EMISSION_CERTIFICATE', label: 'Emission certificate' },
  { value: 'ROUTE_PERMIT', label: 'Route permit copy' },
  { value: 'OTHER', label: 'Other' },
] as const;

export function documentTypeLabel(value?: string): string {
  return DOCUMENT_TYPES.find((d) => d.value === value)?.label ?? value ?? 'Document';
}

export type BusTone = 'success' | 'warning' | 'destructive' | 'muted';

/** One label for a bus: registration status first (MOT's), then day-to-day availability. */
export function busState(bus: Pick<BusResponse, 'status' | 'availability' | 'availableToday'>): { label: string; tone: BusTone } {
  if (bus.status === 'cancelled') return { label: 'Retired', tone: 'muted' };
  if (bus.status === 'inactive') return { label: 'Suspended', tone: 'destructive' };
  if (bus.status === 'pending') return { label: 'Pending', tone: 'warning' };
  if (!bus.availableToday) {
    return { label: bus.availability === 'OFF_ROAD' ? 'Off the road' : 'Under maintenance', tone: 'warning' };
  }
  return { label: 'In service', tone: 'success' };
}
