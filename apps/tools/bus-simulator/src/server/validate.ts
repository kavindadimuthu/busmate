import { TYRE_POSITIONS, type DriverProfileId, type FaultId } from '../core/types.ts';
import type { ControlRequest } from '../shared/protocol.ts';

const PROFILES: readonly DriverProfileId[] = ['smooth', 'normal', 'aggressive'];
const FAULTS: readonly FaultId[] = ['tyre-leak', 'overheat', 'fuel-leak', 'gps-dropout'];

/** Narrows an untrusted request body to a ControlRequest, or explains why it is not one. */
export function parseControl(body: unknown): ControlRequest | string {
  if (typeof body !== 'object' || body === null) return 'body must be a JSON object';
  const b = body as Record<string, unknown>;
  const isNumber = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
  switch (b.type) {
    case 'pause':
    case 'resume':
    case 'restartTrip':
      return { type: b.type };
    case 'setPlayback':
      return isNumber(b.playback) ? { type: 'setPlayback', playback: b.playback as number } : 'playback must be a number';
    case 'setIgnition':
      return typeof b.on === 'boolean' ? { type: 'setIgnition', on: b.on } : 'on must be a boolean';
    case 'setDriverProfile':
      return PROFILES.includes(b.profile as DriverProfileId)
        ? { type: 'setDriverProfile', profile: b.profile as DriverProfileId }
        : `profile must be one of ${PROFILES.join(', ')}`;
    case 'setSpeedLimit':
      return b.kmh === null || (isNumber(b.kmh) && (b.kmh as number) >= 0 && (b.kmh as number) <= 150)
        ? { type: 'setSpeedLimit', kmh: b.kmh as number | null }
        : 'kmh must be null or a number from 0 to 150';
    case 'injectFault':
    case 'clearFault': {
      if (!FAULTS.includes(b.fault as FaultId)) return `fault must be one of ${FAULTS.join(', ')}`;
      if (b.type === 'clearFault') return { type: 'clearFault', fault: b.fault as FaultId };
      if (b.tyre !== undefined && !TYRE_POSITIONS.includes(b.tyre as never)) {
        return `tyre must be one of ${TYRE_POSITIONS.join(', ')}`;
      }
      return { type: 'injectFault', fault: b.fault as FaultId, ...(b.tyre ? { tyre: b.tyre as never } : {}) };
    }
    case 'setFuelLevel':
      return isNumber(b.pct) && (b.pct as number) >= 0 && (b.pct as number) <= 100
        ? { type: 'setFuelLevel', pct: b.pct as number }
        : 'pct must be a number from 0 to 100';
    case 'setup': {
      const out: { type: 'setup'; routeId?: string; deviceSerial?: string; seed?: number } = { type: 'setup' };
      if (b.routeId !== undefined) {
        if (typeof b.routeId !== 'string' || !/^[0-9a-f-]{36}$/i.test(b.routeId)) return 'routeId must be a UUID';
        out.routeId = b.routeId;
      }
      if (b.deviceSerial !== undefined) {
        if (typeof b.deviceSerial !== 'string') return 'deviceSerial must be a string';
        out.deviceSerial = b.deviceSerial;
      }
      if (b.seed !== undefined) {
        if (!Number.isInteger(b.seed)) return 'seed must be an integer';
        out.seed = b.seed as number;
      }
      return out;
    }
    default:
      return `unknown control type ${JSON.stringify(b.type)}`;
  }
}
