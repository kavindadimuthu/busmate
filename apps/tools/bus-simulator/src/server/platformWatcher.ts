import type { PlatformView } from '../shared/protocol.ts';
import { HttpError, type GatewayClient } from './gateway.ts';

const RETRY_MS = 5_000;
const UNAUTHORIZED_RETRY_MS = 30_000;

interface StreamBusPosition {
  busId: string;
  deviceId: string | null;
  lat: number;
  lng: number;
  speedKmh: number | null;
  headingDeg: number | null;
  deviceTimestamp: string | number | null;
  ingestedAt: string | number;
}

interface StreamDeviceStatus {
  deviceId: string;
  status: string;
  ingestedAt: string | number;
}

/**
 * The gateway's stream types these fields as ISO strings, but telemetry-service's Kafka serializer
 * writes instants as epoch seconds, and the gateway forwards them untouched. Accept both.
 */
function toIso(value: string | number | null): string | null {
  if (value == null) return null;
  return typeof value === 'number' ? new Date(value * 1000).toISOString() : value;
}

/**
 * The platform's side of the comparison: watches api-gateway's live stream (the same feed the MOT
 * tracking map uses) and keeps what the platform currently believes about this simulator's device.
 * The stream is staff-only, so this signs in as a staff account.
 */
export class PlatformWatcher {
  private readonly gateway: GatewayClient;
  private readonly credentials: { email: string; password: string } | null;
  private readonly onChange: (message: string) => void;
  private deviceId: string;
  private abort: AbortController | null = null;
  private stopped = false;
  private view: PlatformView;

  constructor(
    gateway: GatewayClient,
    credentials: { email: string; password: string } | null,
    deviceId: string,
    onChange: (message: string) => void,
  ) {
    this.gateway = gateway;
    this.credentials = credentials;
    this.deviceId = deviceId;
    this.onChange = onChange;
    this.view = { state: credentials ? 'connecting' : 'disabled', error: null, bus: null, deviceStatus: null };
  }

  start(): void {
    if (this.credentials) void this.run();
  }

  stop(): void {
    this.stopped = true;
    this.abort?.abort();
  }

  /** Switching device keeps the connection and only changes which events count as ours. */
  watchDevice(deviceId: string): void {
    this.deviceId = deviceId;
    this.view = { ...this.view, bus: null, deviceStatus: null };
  }

  snapshot(): PlatformView {
    return { ...this.view };
  }

  private async run(): Promise<void> {
    while (!this.stopped) {
      let delay = RETRY_MS;
      try {
        this.setState('connecting', null);
        const token = await this.gateway.login(this.credentials!.email, this.credentials!.password);
        await this.consume(token);
        this.setState('error', 'stream closed by the gateway');
      } catch (error) {
        if (this.stopped) return;
        const unauthorized = error instanceof HttpError && (error.status === 401 || error.status === 403);
        delay = unauthorized ? UNAUTHORIZED_RETRY_MS : RETRY_MS;
        this.setState(unauthorized ? 'unauthorized' : 'error', error instanceof Error ? error.message : String(error));
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  private async consume(token: string): Promise<void> {
    this.abort = new AbortController();
    const res = await fetch(`${this.gateway.baseUrl}/live/stream`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
      signal: this.abort.signal,
    });
    if (!res.ok || !res.body) throw new HttpError(res.status, `live stream refused (${res.status})`);
    this.setState('connected', null);

    const decoder = new TextDecoder();
    let buffer = '';
    for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
      buffer += decoder.decode(chunk, { stream: true });
      let boundary: number;
      while ((boundary = buffer.indexOf('\n\n')) >= 0) {
        this.handleBlock(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
      }
    }
  }

  private handleBlock(block: string): void {
    let event = 'message';
    const data: string[] = [];
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
    }
    if (!data.length) return;
    const payload = JSON.parse(data.join('\n')) as unknown;
    if (event === 'snapshot') {
      const snapshot = payload as { buses?: StreamBusPosition[]; devices?: StreamDeviceStatus[] };
      const bus = snapshot.buses?.find((b) => b.deviceId === this.deviceId);
      if (bus) this.acceptPosition(bus);
      const status = snapshot.devices?.find((d) => d.deviceId === this.deviceId);
      if (status) this.acceptStatus(status);
    } else if (event === 'bus-position') {
      const bus = payload as StreamBusPosition;
      if (bus.deviceId === this.deviceId) this.acceptPosition(bus);
    } else if (event === 'device-status') {
      const status = payload as StreamDeviceStatus;
      if (status.deviceId === this.deviceId) this.acceptStatus(status);
    }
  }

  private acceptPosition(bus: StreamBusPosition): void {
    this.view = {
      ...this.view,
      bus: {
        lat: bus.lat,
        lng: bus.lng,
        speedKmh: bus.speedKmh,
        headingDeg: bus.headingDeg,
        deviceTimestamp: toIso(bus.deviceTimestamp),
        ingestedAt: toIso(bus.ingestedAt) as string,
        receivedAt: new Date().toISOString(),
      },
    };
  }

  private acceptStatus(status: StreamDeviceStatus): void {
    const changed = this.view.deviceStatus?.status !== status.status;
    this.view = { ...this.view, deviceStatus: { status: status.status, ingestedAt: toIso(status.ingestedAt) as string } };
    if (changed) this.onChange(`platform sees device ${status.status}`);
  }

  private setState(state: PlatformView['state'], error: string | null): void {
    const changed = state !== this.view.state;
    this.view = { ...this.view, state, error };
    if (changed) this.onChange(error ? `live stream ${state}: ${error}` : `live stream ${state}`);
  }
}
