import { STEP_S, Simulation } from '../core/simulation.ts';
import type { Report, Warning } from '../core/types.ts';
import {
  PLAYBACK_SPEEDS,
  type ConsoleState,
  type ControlRequest,
  type LogEntry,
  type LogKind,
  type SessionInfo,
} from '../shared/protocol.ts';
import { DEMO_DEVICES, publicDeviceInfo, type DeviceCredential } from './devices.ts';
import type { GatewayClient } from './gateway.ts';
import { PlatformWatcher } from './platformWatcher.ts';
import { Publisher, type PublisherEvent } from './publisher.ts';

const TICK_MS = 100;
const LOG_LIMIT = 300;
/** A tick never runs more than this many model steps, so a stalled event loop cannot trigger a burst. */
const MAX_STEPS_PER_TICK = 1_000;

export interface RunnerOptions {
  gateway: GatewayClient;
  routeId: string;
  deviceSerial: string;
  seed: number;
  playback: number;
  streamCredentials: { email: string; password: string } | null;
}

export interface RunnerListener {
  state(state: ConsoleState): void;
  session(session: SessionInfo): void;
  log(entry: LogEntry): void;
}

/** Owns the wall clock: turns real time × playback into fixed model steps, and routes reports out. */
export class Runner {
  private readonly gateway: GatewayClient;
  private readonly watcher: PlatformWatcher;
  private readonly listeners = new Set<RunnerListener>();
  private readonly logEntries: LogEntry[] = [];
  private nextLogId = 1;

  private sim!: Simulation;
  private publisher!: Publisher;
  private device!: DeviceCredential;
  private routeId!: string;
  private seed!: number;
  private paused = false;
  private playback: number;
  private owedSimS = 0;
  private lastTickAt = Date.now();
  private timer: NodeJS.Timeout | null = null;
  private lastWarnings = new Set<string>();
  private lastBroadcastAt = 0;
  private busy: Promise<void> = Promise.resolve();

  private constructor(options: RunnerOptions) {
    this.gateway = options.gateway;
    this.playback = options.playback;
    this.watcher = new PlatformWatcher(options.gateway, options.streamCredentials, '', (m) => this.log('platform', m));
  }

  static async create(options: RunnerOptions): Promise<Runner> {
    const runner = new Runner(options);
    await runner.setup({ routeId: options.routeId, deviceSerial: options.deviceSerial, seed: options.seed });
    runner.watcher.start();
    return runner;
  }

  start(): void {
    this.lastTickAt = Date.now();
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.watcher.stop();
  }

  subscribe(listener: RunnerListener): () => void {
    this.listeners.add(listener);
    listener.session(this.session());
    for (const entry of this.logEntries) listener.log(entry);
    listener.state(this.state());
    return () => this.listeners.delete(listener);
  }

  /** Controls run one at a time so a setup cannot interleave with a command against the old model. */
  control(request: ControlRequest): Promise<void> {
    const run = this.busy.then(() => this.handle(request));
    this.busy = run.catch(() => undefined);
    return run;
  }

  private async handle(request: ControlRequest): Promise<void> {
    switch (request.type) {
      case 'pause':
        this.paused = true;
        this.log('command', 'paused');
        break;
      case 'resume':
        this.paused = false;
        this.lastTickAt = Date.now();
        this.log('command', 'resumed');
        break;
      case 'setPlayback':
        if (!(PLAYBACK_SPEEDS as readonly number[]).includes(request.playback)) {
          throw new BadRequest(`playback must be one of ${PLAYBACK_SPEEDS.join(', ')}`);
        }
        this.playback = request.playback;
        this.log('command', `playback ${request.playback}×`);
        break;
      case 'setup':
        await this.setup(request);
        break;
      default:
        this.sim.apply(request);
        this.log('command', describeCommand(request));
    }
    this.broadcastState();
  }

  private async setup(request: { routeId?: string; deviceSerial?: string; seed?: number }): Promise<void> {
    const deviceSerial = request.deviceSerial ?? this.device?.serial;
    const device = DEMO_DEVICES.find((d) => d.serial === deviceSerial);
    if (!device) throw new BadRequest(`unknown device ${deviceSerial}`);
    const routeId = request.routeId ?? this.routeId;
    const seed = request.seed ?? this.seed;
    if (!Number.isInteger(seed)) throw new BadRequest('seed must be an integer');

    let route;
    try {
      route = await this.gateway.getRoute(routeId);
    } catch (error) {
      throw new BadRequest(`could not load route ${routeId}: ${error instanceof Error ? error.message : error}`);
    }
    let sim;
    try {
      sim = new Simulation({ route, seed });
    } catch (error) {
      throw new BadRequest(error instanceof Error ? error.message : String(error));
    }

    this.sim = sim;
    this.routeId = routeId;
    this.seed = seed;
    this.owedSimS = 0;
    this.lastWarnings.clear();
    if (this.device?.serial !== device.serial || !this.publisher) {
      this.device = device;
      this.publisher = new Publisher(this.gateway, device.token, (e) => this.onPublish(e));
      this.watcher.watchDevice(device.deviceId);
    }
    this.log('info', `driving ${route.name} as ${device.busLabel} (${device.serial}), seed ${seed}`);
    for (const listener of this.listeners) listener.session(this.session());
  }

  private tick(): void {
    const now = Date.now();
    const elapsedS = (now - this.lastTickAt) / 1000;
    this.lastTickAt = now;
    if (!this.paused) {
      this.owedSimS += elapsedS * this.playback;
      const steps = Math.min(Math.floor(this.owedSimS / STEP_S + 1e-9), MAX_STEPS_PER_TICK);
      this.owedSimS = Math.max(0, this.owedSimS - steps * STEP_S);
      const routeBefore = this.sim.route;
      this.sim.step(steps);
      if (this.sim.route !== routeBefore) {
        for (const listener of this.listeners) listener.session(this.session());
      }
      const producedAt = new Date(now);
      this.publisher.enqueue(this.sim.drainReports().map((report) => ({ report, producedAt })));
      this.trackWarnings(this.sim.snapshot().warnings);
    }
    this.publisher.pump(now);
    // The console needs a few frames a second, not ten.
    if (now - this.lastBroadcastAt >= 250) this.broadcastState();
  }

  private trackWarnings(warnings: Warning[]): void {
    const current = new Set(warnings.map((w) => `${w.code}${w.tyre ? `:${w.tyre}` : ''}`));
    for (const w of warnings) {
      const key = `${w.code}${w.tyre ? `:${w.tyre}` : ''}`;
      if (!this.lastWarnings.has(key)) this.log('warning', `raised ${w.code}: ${w.message}`);
    }
    for (const key of this.lastWarnings) {
      if (!current.has(key)) this.log('warning', `cleared ${key}`);
    }
    this.lastWarnings = current;
  }

  private onPublish(event: PublisherEvent): void {
    this.log(event.kind, event.message, event.report);
  }

  private broadcastState(): void {
    this.lastBroadcastAt = Date.now();
    const state = this.state();
    for (const listener of this.listeners) listener.state(state);
  }

  private state(): ConsoleState {
    return {
      clock: { paused: this.paused, playback: this.playback },
      vehicle: this.sim.snapshot(),
      publisher: this.publisher.snapshot(),
      platform: this.watcher.snapshot(),
    };
  }

  private session(): SessionInfo {
    return {
      gatewayUrl: this.gateway.baseUrl,
      seed: this.seed,
      device: publicDeviceInfo(this.device),
      devices: DEMO_DEVICES.map(publicDeviceInfo),
      route: this.sim.route,
    };
  }

  private log(kind: LogKind, message: string, report?: Report): void {
    const entry: LogEntry = {
      id: this.nextLogId++,
      at: new Date().toISOString(),
      simTimeS: report?.simTimeS ?? this.sim?.timeS ?? 0,
      kind,
      message,
    };
    this.logEntries.push(entry);
    if (this.logEntries.length > LOG_LIMIT) this.logEntries.shift();
    for (const listener of this.listeners) listener.log(entry);
  }
}

export class BadRequest extends Error {}

function describeCommand(command: Exclude<ControlRequest, { type: 'pause' | 'resume' | 'setPlayback' | 'setup' }>): string {
  switch (command.type) {
    case 'setIgnition':
      return `ignition ${command.on ? 'on' : 'off'}`;
    case 'setDriverProfile':
      return `driver ${command.profile}`;
    case 'setSpeedLimit':
      return command.kmh == null ? 'speed limit removed' : `speed limit ${command.kmh} km/h`;
    case 'injectFault':
      return `fault injected: ${command.fault}${command.tyre ? ` (${command.tyre})` : ''}`;
    case 'clearFault':
      return `fault cleared: ${command.fault}`;
    case 'setFuelLevel':
      return `fuel set to ${command.pct}%`;
    case 'restartTrip':
      return 'trip restarted';
  }
}
