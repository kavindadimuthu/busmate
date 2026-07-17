import { EventEmitter } from 'events';

/**
 * In-memory read model for the live-tracking SSE stream (IoT Platform Layer plan, Phase 3):
 * latest position per bus and latest health status per device, kept up to date by
 * {@link ../kafkaConsumer} and served to browsers by {@link ./live.routes}.
 *
 * Single-instance only, same caveat as telemetry-service's DeviceRateLimiter/FleetHealthMonitorJob
 * — if api-gateway is ever scaled to more than one instance, each instance's SSE clients would only
 * see events consumed by *that* instance's Kafka consumer. Fine at this scale; a shared store
 * (Redis pub/sub) would be the fix if it's ever needed.
 */

export interface BusPosition {
  busId: string;
  deviceId: string | null;
  tripId: string | null;
  lat: number;
  lng: number;
  speedKmh: number | null;
  headingDeg: number | null;
  deviceTimestamp: string | null;
  ingestedAt: string;
}

export interface DeviceStatusEvent {
  deviceId: string;
  status: string;
  ingestedAt: string;
  payload: unknown;
}

class LiveStateStore extends EventEmitter {
  private readonly busPositions = new Map<string, BusPosition>();
  private readonly deviceStatuses = new Map<string, DeviceStatusEvent>();

  updateBusPosition(position: BusPosition): void {
    this.busPositions.set(position.busId, position);
    this.emit('bus-position', position);
  }

  updateDeviceStatus(status: DeviceStatusEvent): void {
    this.deviceStatuses.set(status.deviceId, status);
    this.emit('device-status', status);
  }

  snapshot(): { buses: BusPosition[]; devices: DeviceStatusEvent[] } {
    return {
      buses: Array.from(this.busPositions.values()),
      devices: Array.from(this.deviceStatuses.values()),
    };
  }
}

export const liveState = new LiveStateStore();
// SSE connections can pile up listeners quickly across many concurrent portal tabs; this store is
// process-wide and long-lived, so raise the default cap rather than let Node warn spuriously.
liveState.setMaxListeners(100);
