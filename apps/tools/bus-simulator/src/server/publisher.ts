import type { Report } from '../core/types.ts';
import type { PublisherStatus } from '../shared/protocol.ts';
import { HttpError, type GatewayClient } from './gateway.ts';

/**
 * telemetry-service rate-limits each device to a burst of 10 and 2 events/s sustained. One location
 * per second leaves room for status events; at high playback the model produces fixes faster than
 * that, so only the newest waiting fix is sent (the platform wants current position, not history).
 */
const MIN_LOCATION_GAP_MS = 1_000;
const RETRY_MIN_MS = 1_000;
const RETRY_MAX_MS = 15_000;

export interface TimedReport {
  report: Report;
  /** Wall clock when the model produced it — becomes the device timestamp. */
  producedAt: Date;
}

export type PublisherEvent =
  | { kind: 'sent' | 'flagged'; report: Report; message: string }
  | { kind: 'failed'; report: Report; message: string };

export class Publisher {
  private readonly gateway: GatewayClient;
  private readonly token: string;
  private readonly onEvent: (event: PublisherEvent) => void;

  /**
   * Ingest rejects any sequenceNo not above the last one it accepted for the device, and remembers
   * it across restarts. Starting from the wall clock in ms keeps every run above every earlier one.
   */
  private nextSequenceNo = Date.now();
  private pendingLocation: TimedReport | null = null;
  private readonly pendingStatuses: TimedReport[] = [];
  private inFlight = false;
  private lastLocationSentAt = 0;
  private retryAt = 0;
  private retryDelayMs = RETRY_MIN_MS;
  private readonly status: PublisherStatus = {
    state: 'idle',
    sent: 0,
    accepted: 0,
    flagged: 0,
    failed: 0,
    coalesced: 0,
    lastError: null,
    lastAcceptedAt: null,
  };

  constructor(gateway: GatewayClient, token: string, onEvent: (event: PublisherEvent) => void) {
    this.gateway = gateway;
    this.token = token;
    this.onEvent = onEvent;
  }

  enqueue(reports: TimedReport[]): void {
    for (const item of reports) {
      if (item.report.kind === 'device-status') {
        this.pendingStatuses.push(item);
      } else {
        if (this.pendingLocation) this.status.coalesced++;
        this.pendingLocation = item;
      }
    }
  }

  /** Called on every runner tick; sends at most one event at a time. */
  pump(now = Date.now()): void {
    if (this.inFlight || now < this.retryAt) return;
    const next = this.pendingStatuses[0]
      ?? (this.pendingLocation && now - this.lastLocationSentAt >= MIN_LOCATION_GAP_MS ? this.pendingLocation : null);
    if (!next) return;
    void this.send(next, now);
  }

  snapshot(): PublisherStatus {
    return { ...this.status };
  }

  private async send(item: TimedReport, now: number): Promise<void> {
    this.inFlight = true;
    const { report } = item;
    if (report.kind === 'location') {
      this.pendingLocation = null;
      this.lastLocationSentAt = now;
    } else {
      this.pendingStatuses.shift();
    }
    this.status.sent++;
    try {
      const result =
        report.kind === 'location'
          ? await this.gateway.ingest('location', this.token, {
              deviceTimestamp: item.producedAt.toISOString(),
              sequenceNo: this.nextSequenceNo++,
              payload: {
                lat: round(report.lat, 6),
                lng: round(report.lng, 6),
                speedKmh: round(report.speedKmh, 1),
                headingDeg: round(report.headingDeg, 1) % 360,
                accuracyM: round(report.accuracyM, 1),
              },
            })
          : await this.gateway.ingest('device-status', this.token, {
              deviceTimestamp: item.producedAt.toISOString(),
              payload: { status: report.status, reason: report.reason },
            });
      this.status.state = 'ok';
      this.status.lastError = null;
      this.retryDelayMs = RETRY_MIN_MS;
      if (result.status === 'flagged') {
        // Accepted by the transport but routed to the dead-letter topic — worth seeing, not retrying.
        this.status.flagged++;
        this.onEvent({ kind: 'flagged', report, message: result.reason ?? 'flagged by ingest' });
      } else {
        this.status.accepted++;
        this.status.lastAcceptedAt = new Date().toISOString();
        this.onEvent({ kind: 'sent', report, message: describe(report) });
      }
    } catch (error) {
      this.status.failed++;
      this.status.state = 'failing';
      this.status.lastError = error instanceof Error ? error.message : String(error);
      this.retryAt = Date.now() + this.retryDelayMs;
      this.retryDelayMs = Math.min(this.retryDelayMs * 2, RETRY_MAX_MS);
      this.onEvent({ kind: 'failed', report, message: this.status.lastError });
      const status = error instanceof HttpError ? error.status : null;
      if (status === 401 || status === 403) {
        // A refused credential will not fix itself; keep the event but back off to the maximum.
        this.retryAt = Date.now() + RETRY_MAX_MS;
        this.requeue(item);
      } else if (status !== null && status >= 400 && status < 500 && status !== 429) {
        // The event itself was rejected; resending it unchanged would fail forever and block the queue.
      } else {
        this.requeue(item);
      }
    } finally {
      this.inFlight = false;
    }
  }

  /** Status events are kept in order; a failed fix is kept only if nothing newer has arrived. */
  private requeue(item: TimedReport): void {
    if (item.report.kind === 'device-status') this.pendingStatuses.unshift(item);
    else if (!this.pendingLocation) this.pendingLocation = item;
    else this.status.coalesced++;
  }
}

const round = (v: number, places: number) => Math.round(v * 10 ** places) / 10 ** places;

function describe(report: Report): string {
  if (report.kind === 'device-status') return `status ${report.status} (${report.reason})`;
  return `fix ${report.lat.toFixed(5)}, ${report.lng.toFixed(5)} · ${report.speedKmh.toFixed(0)} km/h`;
}
