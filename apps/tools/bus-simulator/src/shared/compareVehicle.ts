import type { VehicleState } from '../core/types.ts';
import type { PlatformVehicleData } from './protocol.ts';

/** A platform snapshot older than this reads as stale, like a stale position. */
export const STALE_AFTER_S = 20;

export interface AlertRef {
  code: string;
  /** The tyre, or null when the alert has no component. */
  component: string | null;
}

export interface VehicleComparison {
  /** How old the platform's snapshot is, by the device's own timestamp; null with no snapshot. */
  ageS: number | null;
  stale: boolean;
  /** Alerts the bus holds that the platform does not (not sent yet, or lost). */
  missingOnPlatform: AlertRef[];
  /** Alerts the platform still holds that the bus no longer has (a clear that never arrived). */
  staleOnPlatform: AlertRef[];
  /** Fresh snapshot and the same set of alerts on both sides. */
  inSync: boolean;
}

const key = (a: AlertRef) => `${a.code}:${a.component ?? ''}`;

/**
 * Bus against platform. Alerts are compared exactly, because an alert is a state change the bus owns
 * and the platform must mirror; readings are not, because the platform only receives a snapshot every
 * couple of seconds, so at fast playback it is legitimately far behind the model. Instead the verdict
 * says how old the platform's copy is.
 */
export function compareVehicle(bus: VehicleState, platform: PlatformVehicleData | null, nowMs: number): VehicleComparison {
  const busAlerts: AlertRef[] = bus.warnings.map((w) => ({ code: w.code, component: w.tyre ?? null }));
  const platformAlerts: AlertRef[] = (platform?.activeAlerts ?? []).map((a) => ({ code: a.code, component: a.component ?? null }));

  const busKeys = new Set(busAlerts.map(key));
  const platformKeys = new Set(platformAlerts.map(key));
  const missingOnPlatform = busAlerts.filter((a) => !platformKeys.has(key(a)));
  const staleOnPlatform = platformAlerts.filter((a) => !busKeys.has(key(a)));

  const stamp = platform?.deviceTimestamp ?? platform?.ingestedAt ?? null;
  const ageS = stamp ? Math.max(0, (nowMs - Date.parse(stamp)) / 1000) : null;
  const stale = ageS != null && ageS > STALE_AFTER_S;

  return {
    ageS,
    stale,
    missingOnPlatform,
    staleOnPlatform,
    inSync: platform != null && !stale && missingOnPlatform.length === 0 && staleOnPlatform.length === 0,
  };
}
