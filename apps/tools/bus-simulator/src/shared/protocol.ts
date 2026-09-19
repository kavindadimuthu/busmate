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
  lastError: string | null;
  lastAcceptedAt: string | null;
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

export interface PlatformView {
  state: 'disabled' | 'connecting' | 'connected' | 'unauthorized' | 'error';
  error: string | null;
  bus: PlatformBusView | null;
  deviceStatus: { status: string; ingestedAt: string } | null;
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
