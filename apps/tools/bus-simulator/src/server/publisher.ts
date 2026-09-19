import type { Report } from '../core/types.ts';
import type { PublisherStatus } from '../shared/protocol.ts';
import { HttpError, type IngestGateway, type IngestResult } from './gateway.ts';

/**
 * telemetry-service rate-limits each device to a burst of 10 and 2 events/s sustained, shared across
 * every event type. Position at 1/s plus a snapshot every 2 s leaves headroom for status changes and
 * alerts. At high playback the model produces both faster than that, so only the newest waiting
 * reading of each is sent (the platform wants current state, not history).
 */
const MIN_LOCATION_GAP_MS = 1_000;
const MIN_SNAPSHOT_GAP_MS = 2_000;
const RETRY_MIN_MS = 1_000;
const RETRY_MAX_MS = 15_000;
/** Ordered events (status, alerts) queue through an outage; beyond this the oldest are dropped and counted. */
const ORDERED_QUEUE_LIMIT = 500;

export interface TimedReport {
  report: Report;
  /** Wall clock when the model produced it — becomes the device timestamp. */
  producedAt: Date;
}

export type PublisherEvent =
  | { kind: 'sent' | 'flagged'; report: Report; message: string }
  | { kind: 'failed'; report: Report; message: string };

export class Publisher {
  private readonly gateway: IngestGateway;
  private readonly token: string;
  private readonly onEvent: (event: PublisherEvent) => void;

  /**
   * Ingest rejects any sequenceNo not above the last one it accepted for the device, and remembers
   * it across restarts. Starting from the wall clock in ms keeps every run above every earlier one.
   */
  private nextSequenceNo = Date.now();
  private pendingLocation: TimedReport | null = null;
  private pendingSnapshot: TimedReport | null = null;
  /** Device-status and alert events: state changes, never merged or reordered. */
  private readonly ordered: TimedReport[] = [];
  private inFlight = false;
  private lastLocationSentAt = 0;
  private lastSnapshotSentAt = 0;
  private retryAt = 0;
  private retryDelayMs = RETRY_MIN_MS;
  private readonly status: PublisherStatus = {
    state: 'idle',
    sent: 0,
    accepted: 0,
    flagged: 0,
    failed: 0,
    coalesced: 0,
    dropped: 0,
    lastError: null,
    lastAcceptedAt: null,
    lastVehicleAcceptedAt: null,
  };

  constructor(gateway: IngestGateway, token: string, onEvent: (event: PublisherEvent) => void) {
    this.gateway = gateway;
    this.token = token;
    this.onEvent = onEvent;
  }

  enqueue(reports: TimedReport[]): void {
    for (const item of reports) {
      switch (item.report.kind) {
        case 'device-status':
        case 'alert':
          this.pushOrdered(item);
          break;
        case 'vehicle-telemetry':
          if (this.pendingSnapshot) this.status.coalesced++;
          this.pendingSnapshot = item;
          break;
        case 'location':
          if (this.pendingLocation) this.status.coalesced++;
          this.pendingLocation = item;
          break;
      }
    }
  }

  /** True once nothing is waiting to be sent — used to retire a publisher after a bus switch. */
  isIdle(): boolean {
    return !this.inFlight && this.ordered.length === 0 && !this.pendingLocation && !this.pendingSnapshot;
  }

  /** Called on every runner tick; sends at most one event at a time. */
  pump(now = Date.now()): void {
    if (this.inFlight || now < this.retryAt) return;
    const next =
      this.ordered[0] ??
      (this.pendingSnapshot && now - this.lastSnapshotSentAt >= MIN_SNAPSHOT_GAP_MS ? this.pendingSnapshot : null) ??
      (this.pendingLocation && now - this.lastLocationSentAt >= MIN_LOCATION_GAP_MS ? this.pendingLocation : null);
    if (!next) return;
    void this.send(next, now);
  }

  snapshot(): PublisherStatus {
    return { ...this.status };
  }

  private pushOrdered(item: TimedReport): void {
    this.ordered.push(item);
    while (this.ordered.length > ORDERED_QUEUE_LIMIT) {
      this.ordered.shift();
      this.status.dropped++;
    }
  }

  private async send(item: TimedReport, now: number): Promise<void> {
    this.inFlight = true;
    const { report } = item;
    switch (report.kind) {
      case 'location':
        this.pendingLocation = null;
        this.lastLocationSentAt = now;
        break;
      case 'vehicle-telemetry':
        this.pendingSnapshot = null;
        this.lastSnapshotSentAt = now;
        break;
      default:
        this.ordered.shift();
    }
    this.status.sent++;
    let body: unknown;
    try {
      body = this.bodyFor(item);
    } catch (error) {
      // An event that cannot even be built will never succeed: report it and move on.
      this.status.failed++;
      this.status.lastError = error instanceof Error ? error.message : String(error);
      this.notify({ kind: 'failed', report, message: this.status.lastError });
      this.inFlight = false;
      return;
    }
    let result: IngestResult;
    try {
      result = await this.gateway.ingest(report.kind, this.token, body);
    } catch (error) {
      this.failed(item, error, now);
      this.inFlight = false;
      return;
    }
    // Only the network call decides whether to retry. Everything after it — bookkeeping and the
    // callback — must never cause an already-accepted event to be sent again.
    this.inFlight = false;
    this.status.state = 'ok';
    this.status.lastError = null;
    this.retryDelayMs = RETRY_MIN_MS;
    if (result.status === 'flagged') {
      // Accepted by the transport but routed to the dead-letter topic — worth seeing, not retrying.
      this.status.flagged++;
      this.notify({ kind: 'flagged', report, message: result.reason ?? 'flagged by ingest' });
    } else {
      this.status.accepted++;
      this.status.lastAcceptedAt = new Date().toISOString();
      if (report.kind === 'vehicle-telemetry' || report.kind === 'alert') {
        this.status.lastVehicleAcceptedAt = this.status.lastAcceptedAt;
      }
      this.notify({ kind: 'sent', report, message: describe(report) });
    }
  }

  private failed(item: TimedReport, error: unknown, now: number): void {
    const { report } = item;
    this.status.failed++;
    this.status.state = 'failing';
    this.status.lastError = error instanceof Error ? error.message : String(error);
    this.retryAt = now + this.retryDelayMs;
    this.retryDelayMs = Math.min(this.retryDelayMs * 2, RETRY_MAX_MS);
    this.notify({ kind: 'failed', report, message: this.status.lastError });
    const status = error instanceof HttpError ? error.status : null;
    if (status === 401 || status === 403) {
      // A refused credential will not fix itself; keep the event but back off to the maximum.
      this.retryAt = now + RETRY_MAX_MS;
      this.requeue(item);
    } else if (status !== null && status >= 400 && status < 500 && status !== 429) {
      // The event itself was rejected; resending it unchanged would fail forever and block the queue.
    } else {
      this.requeue(item);
    }
  }

  /** A misbehaving listener must not break delivery. */
  private notify(event: PublisherEvent): void {
    try {
      this.onEvent(event);
    } catch {
      // Ignored: the event was already delivered or handled; only its display failed.
    }
  }

  private bodyFor({ report, producedAt }: TimedReport): unknown {
    const deviceTimestamp = producedAt.toISOString();
    switch (report.kind) {
      case 'location':
        return {
          deviceTimestamp,
          sequenceNo: this.nextSequenceNo++,
          payload: {
            lat: round(report.lat, 6),
            lng: round(report.lng, 6),
            speedKmh: round(report.speedKmh, 1),
            headingDeg: round(report.headingDeg, 1) % 360,
            accuracyM: round(report.accuracyM, 1),
          },
        };
      case 'device-status':
        return { deviceTimestamp, payload: { status: report.status, reason: report.reason } };
      case 'vehicle-telemetry':
        return { deviceTimestamp, payload: report.payload };
      case 'alert':
        return {
          deviceTimestamp,
          payload: {
            code: report.code,
            state: report.state,
            severity: report.severity,
            ...(report.component ? { component: report.component } : {}),
            message: report.message.slice(0, 200),
          },
        };
    }
  }

  /**
   * Ordered events go back to the front, in order. A reading is kept only if nothing newer has
   * arrived meanwhile — the newer one already supersedes it.
   */
  private requeue(item: TimedReport): void {
    switch (item.report.kind) {
      case 'device-status':
      case 'alert':
        this.ordered.unshift(item);
        break;
      case 'vehicle-telemetry':
        if (!this.pendingSnapshot) this.pendingSnapshot = item;
        else this.status.coalesced++;
        break;
      case 'location':
        if (!this.pendingLocation) this.pendingLocation = item;
        else this.status.coalesced++;
        break;
    }
  }
}

const round = (v: number, places: number) => Math.round(v * 10 ** places) / 10 ** places;

function describe(report: Report): string {
  switch (report.kind) {
    case 'device-status':
      return `status ${report.status} (${report.reason})`;
    case 'location':
      return `fix ${report.lat.toFixed(5)}, ${report.lng.toFixed(5)} · ${report.speedKmh.toFixed(0)} km/h`;
    case 'vehicle-telemetry':
      return `vehicle health · fuel ${report.payload.fuel?.levelPct?.toFixed(0) ?? '?'}% · coolant ${report.payload.engine?.coolantTempC?.toFixed(0) ?? '?'}°C`;
    case 'alert':
      return `alert ${report.state} ${report.code}${report.component ? ` (${report.component})` : ''} · ${report.severity}`;
  }
}
