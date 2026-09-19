// What passes between the simulator server and its console. Local to this tool — nothing here is a
// BusMate contract.
import type { SimRoute } from '../core/route.ts';
import type { Command, VehicleState } from '../core/types.ts';

export interface DeviceInfo {
  serial: string;
  deviceId: string;
  busId: string;
  busLabel: string;
}

export interface RouteSummary {
  id: string;
  name: string;
  routeNumber: string | null;
  roadType: string;
  locatedStops: number;
}

export interface SessionInfo {
  gatewayUrl: string;
  seed: number;
  device: DeviceInfo;
  devices: DeviceInfo[];
  /** The route in its current driving direction. */
  route: SimRoute;
}

export interface ClockState {
  paused: boolean;
  playback: number;
}

export interface PublisherStatus {
  /** `failing` once the last attempt could not reach the platform or was refused. */
  state: 'idle' | 'ok' | 'failing';
  sent: number;
  accepted: number;
  flagged: number;
  failed: number;
  /** Fixes superseded by a newer one before they could be sent (high playback, or while failing). */
  coalesced: number;
  /** Alerts or status events discarded because the platform stayed unreachable past the queue limit. */
  dropped: number;
  lastError: string | null;
  lastAcceptedAt: string | null;
  /** Last time a vehicle-health snapshot or alert was accepted. */
  lastVehicleAcceptedAt: string | null;
}

export interface PlatformBusView {
  lat: number;
  lng: number;
  speedKmh: number | null;
  headingDeg: number | null;
  deviceTimestamp: string | null;
  ingestedAt: string;
  /** When this simulator saw the event on the stream. */
  receivedAt: string;
}

/** An alert the platform currently holds raised for the bus. */
export interface PlatformAlert {
  code: string;
  /** The tyre, for a per-tyre alert; null when the alert has no component. */
  component: string | null;
  severity: string;
  message: string | null;
  raisedAt: string | null;
}

/** Subset of the platform's snapshot the console compares; the platform stores the payload as sent. */
export interface PlatformSnapshot {
  ignition?: boolean;
  odometerKm?: number;
  engine?: { running?: boolean; rpm?: number; coolantTempC?: number; derated?: boolean };
  fuel?: { levelPct?: number; levelL?: number };
  tyres?: Array<{ position: string; pressureKpa?: number; tempC?: number }>;
  cabin?: { passengers?: number; doorsOpen?: boolean };
}

/** What the platform holds about one bus's vehicle health, as read back through the gateway. */
export interface PlatformVehicleData {
  operatorId: string | null;
  /** When the device says the snapshot was taken. */
  deviceTimestamp: string | null;
  ingestedAt: string | null;
  snapshot: PlatformSnapshot;
  activeAlerts: PlatformAlert[];
  /** When this simulator last read it. */
  receivedAt: string;
}

export interface PlatformVehicleView {
  /** `waiting`: the platform has no state for this bus yet. `disabled`: no staff sign-in to read with. */
  state: 'disabled' | 'waiting' | 'ok' | 'error';
  error: string | null;
  data: PlatformVehicleData | null;
}

export interface PlatformView {
  state: 'disabled' | 'connecting' | 'connected' | 'unauthorized' | 'error';
  error: string | null;
  bus: PlatformBusView | null;
  deviceStatus: { status: string; ingestedAt: string } | null;
  /** Vehicle health as the platform holds it (INC-026). */
  vehicle: PlatformVehicleView;
}

export interface ConsoleState {
  clock: ClockState;
  vehicle: VehicleState;
  publisher: PublisherStatus;
  platform: PlatformView;
}

export type LogKind = 'sent' | 'flagged' | 'failed' | 'command' | 'platform' | 'warning' | 'info';

export interface LogEntry {
  id: number;
  at: string;
  simTimeS: number;
  kind: LogKind;
  message: string;
}

export type ControlRequest =
  | Command
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'setPlayback'; playback: number }
  | { type: 'setup'; routeId?: string; deviceSerial?: string; seed?: number };

export const PLAYBACK_SPEEDS = [1, 2, 5, 10, 30, 60] as const;
