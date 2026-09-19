import type { PlatformVehicleView } from '../shared/protocol.ts';
import { HttpError, type VehicleStateResult } from './gateway.ts';

/** What the poller needs from the outside, so its session handling can be tested without a network. */
export interface VehicleSource {
  login(): Promise<string>;
  getVehicleState(token: string, busId: string): Promise<VehicleStateResult>;
}

const POLL_MS = 2_000;
const ERROR_POLL_MS = 5_000;

/**
 * Reads the platform's vehicle health for the bus being driven (INC-026), through the gateway, as a
 * signed-in staff account — the same door a portal would use, so it sees exactly what INC-024's
 * isolation allows. There is no vehicle stream, so it polls.
 *
 * A refused token (expired session) is renewed with one fresh sign-in and the read retried; a bus
 * with no state yet is "waiting", not an error; an unreachable platform is reported and retried more
 * slowly. Switching bus discards anything still in flight for the previous one.
 */
export class VehiclePoller {
  private readonly source: VehicleSource;
  private readonly enabled: boolean;
  private busId: string | null = null;
  private token: string | null = null;
  private timer: NodeJS.Timeout | null = null;
  private stopped = false;
  private inFlight = false;
  private view: PlatformVehicleView;

  constructor(source: VehicleSource, enabled: boolean) {
    this.source = source;
    this.enabled = enabled;
    this.view = { state: enabled ? 'waiting' : 'disabled', error: null, data: null };
  }

  start(): void {
    if (this.enabled) this.schedule(0);
  }

  stop(): void {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
  }

  /** Moves the view to another bus: what was known about the previous one is dropped at once. */
  watchBus(busId: string): void {
    if (busId === this.busId) return;
    this.busId = busId;
    this.view = { state: this.enabled ? 'waiting' : 'disabled', error: null, data: null };
  }

  snapshot(): PlatformVehicleView {
    return { ...this.view };
  }

  /** One read. Public so tests can drive it without timers. */
  async pollOnce(): Promise<void> {
    const busId = this.busId;
    if (!this.enabled || !busId || this.inFlight) return;
    this.inFlight = true;
    try {
      const result = await this.read(busId);
      if (busId !== this.busId) return; // the bus changed while this was in flight
      this.view = result.status === 'ok'
        ? { state: 'ok', error: null, data: result.data }
        : { state: 'waiting', error: null, data: null };
    } catch (error) {
      if (busId !== this.busId) return;
      // Keep the last good data on screen, marked as an error, so a blip does not blank the panel.
      this.view = { state: 'error', error: error instanceof Error ? error.message : String(error), data: this.view.data };
    } finally {
      this.inFlight = false;
    }
  }

  private async read(busId: string): Promise<VehicleStateResult> {
    const token = this.token ?? (this.token = await this.source.login());
    try {
      return await this.source.getVehicleState(token, busId);
    } catch (error) {
      if (!(error instanceof HttpError) || (error.status !== 401 && error.status !== 403)) throw error;
      // The session expired or was refused: sign in again once, then retry the read.
      this.token = null;
      this.token = await this.source.login();
      return await this.source.getVehicleState(this.token, busId);
    }
  }

  private schedule(delayMs: number): void {
    if (this.stopped) return;
    this.timer = setTimeout(async () => {
      await this.pollOnce();
      this.schedule(this.view.state === 'error' ? ERROR_POLL_MS : POLL_MS);
    }, delayMs);
  }
}
