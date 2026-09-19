import { offsetM } from './geo.ts';
import { createRng, gaussian, type Rng } from './rng.ts';
import { buildPath, pointAt, reversePath, type RoutePath, type SimRoute } from './route.ts';
import {
  TYRE_POSITIONS,
  type ActiveFault,
  type Command,
  type DriverProfileId,
  type FaultId,
  type Report,
  type TripPhase,
  type TyrePosition,
  type TyreState,
  type VehicleState,
  type Warning,
} from './types.ts';

// A plausible single-deck diesel bus, not a surveyed one. The model aims for the right relationships
// (fuel burns faster under load, RPM follows speed and gear, tyres heat with speed) rather than
// engineering accuracy — INC-022 asks for plausible, and a demo never shows the difference.
const MASS_EMPTY_KG = 11_000;
const PASSENGER_KG = 65;
const G = 9.81;
const ROLLING_COEFF = 0.01;
const AIR_DENSITY = 1.2;
const DRAG_AREA_M2 = 4.9; // Cd × frontal area
const WHEEL_RADIUS_M = 0.5;
const GEAR_RATIOS = [6.2, 3.8, 2.4, 1.6, 1.15, 0.85];
const FINAL_DRIVE = 4.1;
const DRIVETRAIN_EFF = 0.9;
const IDLE_RPM = 650;
const REDLINE_RPM = 2600;
const MAX_POWER_W = 160_000;
const MAX_TORQUE_NM = 700;
const FUEL_IDLE_LPH = 1.8;
/** Air conditioning, air compressor and alternator — drawn whenever the engine runs. */
const AUXILIARY_LOAD_W = 12_000;
const FUEL_L_PER_KWH = 0.26; // ≈ 220 g/kWh at diesel's 0.84 kg/L
const FUEL_LEAK_LPH = 60;
const TANK_L = 200;
const TYRE_NOMINAL_KPA = 760; // ≈ 110 psi cold
const TYRE_LEAK_KPA_PER_S = 20 / 60;
const ATMOSPHERE_KPA = 101.3;
const CAPACITY = 54;

const COOLANT_WARN_C = 105;
const COOLANT_DERATE_C = 112;
const COOLANT_DERATE_CLEAR_C = 100;
const LOW_FUEL_PCT = 15;
const BATTERY_LOW_V = 24;
const TYRE_LOW_FRACTION = 0.8;

/** Arrival tolerance: a bus this close to a stop and nearly stopped has arrived. */
const STOP_SNAP_M = 8;

interface DriverProfile {
  cruiseFactor: number;
  /** Throttle per km/h of speed error. */
  gain: number;
  maxThrottle: number;
  comfortDecel: number;
  maxDecel: number;
  upshiftRpm: number;
}

const DRIVER_PROFILES: Record<DriverProfileId, DriverProfile> = {
  smooth: { cruiseFactor: 0.9, gain: 0.08, maxThrottle: 0.6, comfortDecel: 0.9, maxDecel: 1.8, upshiftRpm: 1600 },
  normal: { cruiseFactor: 1.0, gain: 0.12, maxThrottle: 0.8, comfortDecel: 1.2, maxDecel: 2.5, upshiftRpm: 1800 },
  aggressive: { cruiseFactor: 1.12, gain: 0.3, maxThrottle: 1.0, comfortDecel: 2.0, maxDecel: 3.5, upshiftRpm: 2200 },
};

function cruiseKmhFor(roadType: string): number {
  return roadType === 'EXPRESSWAY' ? 85 : 50;
}

export interface SimulationOptions {
  route: SimRoute;
  seed: number;
  driverProfile?: DriverProfileId;
  ambientTempC?: number;
  initialFuelPct?: number;
  /** Sim seconds between location reports while the ignition is on. */
  reportIntervalS?: number;
  /** Drive back along the reversed route after reaching the terminus. */
  loop?: boolean;
}

/** Fixed step, sim seconds. Stepping in fixed increments is what makes a run reproducible. */
export const STEP_S = 0.1;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
/** First-order approach of `current` toward `target` with time constant `tauS`. */
const approach = (current: number, target: number, dtS: number, tauS: number) =>
  current + (target - current) * (1 - Math.exp(-dtS / tauS));

interface TyreInternal {
  position: TyrePosition;
  coldKpa: number;
  tempC: number;
}

export class Simulation {
  private readonly rng: Rng;
  private readonly ambientC: number;
  private readonly reportIntervalS: number;
  private readonly loop: boolean;
  private readonly baseRoute: SimRoute;

  private path: RoutePath;
  private reversed = false;
  private simTimeS = 0;
  private nextReportAtS = 0;
  private reports: Report[] = [];

  private ignition = true;
  private running = true;
  private driverProfile: DriverProfileId;
  private speedLimitKmh: number | null = null;
  private traffic = 0.9;

  private distanceM = 0;
  private speedMps = 0;
  private accelMps2 = 0;
  private odometerM = 0;
  private headingDeg = 0;
  private throttle = 0;
  private brakeDecel = 0;
  private tractionPowerW = 0;
  private gear = 1;
  private rpm = IDLE_RPM;
  private derated = false;
  private coolantC: number;
  private engineHours = 0;
  private fuelL: number;
  private fuelRateLph = 0;
  private batteryV = 27.6;

  private phase: TripPhase = 'dwelling';
  private nextStopIndex = 0;
  private dwellRemainingS = 0;
  private stopsServed = 0;
  private passengers = 0;
  private doorsOpen = false;

  private readonly tyres: TyreInternal[];
  private faults: ActiveFault[] = [];

  constructor(options: SimulationOptions) {
    this.rng = createRng(options.seed);
    this.baseRoute = options.route;
    this.path = buildPath(options.route);
    this.ambientC = options.ambientTempC ?? 30;
    this.reportIntervalS = options.reportIntervalS ?? 5;
    this.loop = options.loop ?? true;
    this.driverProfile = options.driverProfile ?? 'normal';
    this.coolantC = this.ambientC;
    this.fuelL = (TANK_L * clamp(options.initialFuelPct ?? 80, 0, 100)) / 100;
    this.tyres = TYRE_POSITIONS.map((position) => ({
      position,
      coldKpa: TYRE_NOMINAL_KPA + gaussian(this.rng) * 8,
      tempC: this.ambientC,
    }));
    this.headingDeg = pointAt(this.path, 0).headingDeg;
    this.arriveAtStop();
    this.emitStatus('ONLINE', 'simulator started');
  }

  get timeS(): number {
    return this.simTimeS;
  }

  /** Advances the model by `steps` fixed steps. */
  step(steps = 1): void {
    for (let i = 0; i < steps; i++) this.tick(STEP_S);
  }

  apply(command: Command): void {
    switch (command.type) {
      case 'setIgnition':
        if (command.on === this.ignition) return;
        this.ignition = command.on;
        this.running = command.on && this.fuelL > 0;
        this.emitStatus(command.on ? 'ONLINE' : 'OFFLINE', command.on ? 'ignition on' : 'ignition off');
        return;
      case 'setDriverProfile':
        this.driverProfile = command.profile;
        return;
      case 'setSpeedLimit':
        this.speedLimitKmh = command.kmh == null ? null : Math.max(0, command.kmh);
        return;
      case 'injectFault':
        this.injectFault(command.fault, command.tyre);
        return;
      case 'clearFault':
        this.clearFault(command.fault);
        return;
      case 'setFuelLevel':
        this.fuelL = (TANK_L * clamp(command.pct, 0, 100)) / 100;
        if (this.fuelL > 0 && this.ignition) this.running = true;
        return;
      case 'restartTrip':
        this.path = buildPath(this.baseRoute);
        this.reversed = false;
        this.distanceM = 0;
        this.speedMps = 0;
        this.passengers = 0;
        this.nextStopIndex = 0;
        this.arriveAtStop();
        return;
    }
  }

  /** Reports produced since the last drain, oldest first. */
  drainReports(): Report[] {
    const out = this.reports;
    this.reports = [];
    return out;
  }

  snapshot(): VehicleState {
    const here = pointAt(this.path, this.distanceM);
    const gpsFix = this.gpsHasFix();
    const nextStop = this.phase === 'arrived' ? null : this.path.route.stops[this.nextStopIndex];
    const speedKmh = this.speedMps * 3.6;
    return {
      simTimeS: this.simTimeS,
      ignition: this.ignition,
      driverProfile: this.driverProfile,
      speedLimitKmh: this.speedLimitKmh,
      engine: {
        running: this.running,
        rpm: Math.round(this.rpm),
        gear: this.running ? this.gear : 0,
        loadPct: this.loadPct(),
        coolantTempC: this.coolantC,
        oilPressureKpa: this.oilPressureKpa(),
        hours: this.engineHours,
        derated: this.derated,
      },
      motion: {
        speedKmh,
        accelMps2: this.accelMps2,
        odometerKm: this.odometerM / 1000,
        headingDeg: this.headingDeg,
        lat: here.lat,
        lng: here.lng,
        throttlePct: this.throttle * 100,
        brakePct: (this.brakeDecel / DRIVER_PROFILES[this.driverProfile].maxDecel) * 100,
      },
      fuel: {
        levelL: this.fuelL,
        capacityL: TANK_L,
        levelPct: (this.fuelL / TANK_L) * 100,
        rateLph: this.fuelRateLph,
      },
      electrical: { batteryV: this.batteryV, charging: this.running },
      tyres: this.tyres.map((t) => this.tyreState(t)),
      cabin: { doorsOpen: this.doorsOpen, passengers: this.passengers, capacity: CAPACITY },
      trip: {
        routeId: this.baseRoute.id,
        routeName: this.baseRoute.name,
        phase: this.phase,
        reversed: this.reversed,
        distanceM: this.distanceM,
        totalM: this.path.totalM,
        nextStopIndex: this.nextStopIndex,
        nextStopName: nextStop?.name ?? null,
        distanceToNextStopM: nextStop ? this.path.stopDistancesM[this.nextStopIndex] - this.distanceM : null,
        dwellRemainingS: this.dwellRemainingS,
        stopsServed: this.stopsServed,
      },
      gps: gpsFix
        ? { fix: true, lat: here.lat, lng: here.lng, accuracyM: 5 }
        : { fix: false, lat: null, lng: null, accuracyM: null },
      faults: this.faults.map((f) => ({ ...f })),
      warnings: this.warnings(),
    };
  }

  /** The route in its current driving direction, for drawing. */
  get route(): SimRoute {
    return this.path.route;
  }

  // --- model ---------------------------------------------------------------------------------

  private tick(dt: number): void {
    this.simTimeS += dt;
    this.updateTraffic(dt);
    this.updateTrip(dt);
    this.updateDriver();
    this.updatePowertrain(dt);
    this.updateFuel(dt);
    this.updateThermal(dt);
    this.updateElectrical(dt);
    this.updateTyres(dt);
    this.maybeReport();
  }

  /** Slow random drift in how freely traffic flows, so no two stretches drive identically. */
  private updateTraffic(dt: number): void {
    this.traffic += ((0.9 - this.traffic) * dt) / 300 + gaussian(this.rng) * 0.02 * Math.sqrt(dt);
    this.traffic = clamp(this.traffic, 0.55, 1.1);
  }

  private updateTrip(dt: number): void {
    if (this.phase !== 'dwelling') return;
    this.dwellRemainingS -= dt;
    if (this.dwellRemainingS > 0) return;
    this.dwellRemainingS = 0;
    this.doorsOpen = false;
    const lastIndex = this.path.route.stops.length - 1;
    if (this.nextStopIndex < lastIndex) {
      this.nextStopIndex++;
      this.phase = 'driving';
    } else if (this.loop) {
      this.path = reversePath(this.path);
      this.reversed = !this.reversed;
      this.distanceM = 0;
      this.nextStopIndex = 1;
      this.phase = 'driving';
    } else {
      this.phase = 'arrived';
    }
  }

  private updateDriver(): void {
    const profile = DRIVER_PROFILES[this.driverProfile];
    const vKmh = this.speedMps * 3.6;

    if (!this.running || this.phase !== 'driving') {
      // Engine off or at a stop: hold, or pull up if still rolling.
      this.throttle = 0;
      this.brakeDecel = this.speedMps > 0 ? profile.comfortDecel : 0;
      return;
    }

    const toStopM = Math.max(this.path.stopDistancesM[this.nextStopIndex] - this.distanceM, 0);
    const stoppingKmh = Math.sqrt(2 * profile.comfortDecel * Math.max(toStopM - 3, 0)) * 3.6;
    let target = cruiseKmhFor(this.path.route.roadType) * profile.cruiseFactor * this.traffic;
    if (this.speedLimitKmh != null) target = Math.min(target, this.speedLimitKmh);
    target = Math.min(target, stoppingKmh);

    const error = target - vKmh;
    // Feed-forward: the deceleration that stops exactly at the stop, so a lagging controller
    // never sails past it.
    const requiredDecel = toStopM > 0.5 ? this.speedMps ** 2 / (2 * toStopM) : profile.maxDecel;
    if (error > 0.5) {
      this.throttle = Math.min(profile.maxThrottle, profile.gain * error);
      this.brakeDecel = 0;
    } else if (error < -1 || requiredDecel > profile.comfortDecel * 0.8) {
      this.throttle = 0;
      this.brakeDecel = Math.min(profile.maxDecel, Math.max(-error * 0.15, requiredDecel));
    } else {
      this.throttle = 0;
      this.brakeDecel = 0;
    }
  }

  private updatePowertrain(dt: number): void {
    const profile = DRIVER_PROFILES[this.driverProfile];
    const v = this.speedMps;
    const wheelRpm = (v / (2 * Math.PI * WHEEL_RADIUS_M)) * 60;
    const engineRpmIn = (gear: number) => wheelRpm * GEAR_RATIOS[gear - 1] * FINAL_DRIVE;

    if (v < 0.5) {
      this.gear = 1;
    } else if (this.gear < GEAR_RATIOS.length && engineRpmIn(this.gear) > profile.upshiftRpm && engineRpmIn(this.gear + 1) > 1000) {
      this.gear++;
    } else if (this.gear > 1 && engineRpmIn(this.gear) < 1000) {
      this.gear--;
    }

    if (this.running) {
      const launchRpm = v < 2 && this.throttle > 0 ? 400 * this.throttle : 0;
      this.rpm = clamp(Math.max(IDLE_RPM + launchRpm, engineRpmIn(this.gear)), IDLE_RPM, REDLINE_RPM);
    } else {
      this.rpm = 0;
    }

    let tractionN = 0;
    if (this.running && this.throttle > 0) {
      const powerCurve = clamp(0.35 + (0.65 * (this.rpm - IDLE_RPM)) / (1900 - IDLE_RPM), 0.35, 1);
      const powerW = MAX_POWER_W * powerCurve * (this.derated ? 0.45 : 1);
      const torqueLimitedN = (MAX_TORQUE_NM * GEAR_RATIOS[this.gear - 1] * FINAL_DRIVE * DRIVETRAIN_EFF) / WHEEL_RADIUS_M;
      const powerLimitedN = (powerW * DRIVETRAIN_EFF) / Math.max(v, 0.5);
      tractionN = this.throttle * Math.min(torqueLimitedN, powerLimitedN);
    }
    this.tractionPowerW = tractionN * v;

    const massKg = MASS_EMPTY_KG + this.passengers * PASSENGER_KG;
    const resistN = v > 0 ? massKg * G * ROLLING_COEFF + 0.5 * AIR_DENSITY * DRAG_AREA_M2 * v * v : 0;
    const brakeN = this.brakeDecel * massKg;
    let accel = (tractionN - resistN - brakeN) / massKg;
    if (v <= 0 && accel < 0) accel = 0;
    this.accelMps2 = accel;
    this.speedMps = Math.max(0, v + accel * dt);

    const advance = this.speedMps * dt;
    this.odometerM += advance;
    this.distanceM = Math.min(this.distanceM + advance, this.path.totalM);
    if (this.running) this.engineHours += dt / 3600;

    const here = pointAt(this.path, this.distanceM);
    if (this.speedMps > 0.3) this.headingDeg = here.headingDeg;

    if (this.phase === 'driving') {
      const toStopM = this.path.stopDistancesM[this.nextStopIndex] - this.distanceM;
      if (toStopM <= 0 || (toStopM < STOP_SNAP_M && this.speedMps < 0.6)) {
        this.distanceM = this.path.stopDistancesM[this.nextStopIndex];
        this.speedMps = 0;
        this.accelMps2 = 0;
        this.arriveAtStop();
      }
    }
  }

  private updateFuel(dt: number): void {
    const burnLph = this.running
      ? FUEL_IDLE_LPH + ((this.tractionPowerW + AUXILIARY_LOAD_W) / 1000) * FUEL_L_PER_KWH
      : 0;
    const leakLph = this.hasFault('fuel-leak') ? FUEL_LEAK_LPH : 0;
    this.fuelRateLph = burnLph + leakLph;
    this.fuelL = Math.max(0, this.fuelL - (this.fuelRateLph * dt) / 3600);
    if (this.fuelL <= 0) this.running = false;
  }

  private updateThermal(dt: number): void {
    if (this.running) {
      const target = 86 + this.loadPct() * 0.06 + (this.hasFault('overheat') ? 34 : 0);
      this.coolantC = approach(this.coolantC, target, dt, 90);
    } else {
      this.coolantC = approach(this.coolantC, this.ambientC, dt, 1200);
    }
    if (this.coolantC >= COOLANT_DERATE_C) this.derated = true;
    else if (this.coolantC < COOLANT_DERATE_CLEAR_C) this.derated = false;
  }

  private updateElectrical(dt: number): void {
    if (this.running) this.batteryV = approach(this.batteryV, 27.8, dt, 60);
    else if (this.ignition) this.batteryV = approach(this.batteryV, 23.2, dt, 1800);
    else this.batteryV = approach(this.batteryV, 25.4, dt, 600);
  }

  private updateTyres(dt: number): void {
    const vKmh = this.speedMps * 3.6;
    for (const tyre of this.tyres) {
      if (this.isLeaking(tyre.position)) tyre.coldKpa = Math.max(100, tyre.coldKpa - TYRE_LEAK_KPA_PER_S * dt);
      const underinflation = Math.max(0, 1 - tyre.coldKpa / TYRE_NOMINAL_KPA);
      const target = this.ambientC + 2 + vKmh * 0.3 + underinflation * (vKmh / 60) * 25;
      tyre.tempC = approach(tyre.tempC, target, dt, 240);
    }
  }

  private maybeReport(): void {
    if (this.simTimeS + 1e-9 < this.nextReportAtS) return;
    // A parked tracker reports less often, as real ones do to spare the battery.
    this.nextReportAtS = this.simTimeS + (this.ignition ? this.reportIntervalS : this.reportIntervalS * 6);
    if (!this.gpsHasFix()) return;
    const accuracyM = 4 + this.rng() * 4;
    const here = pointAt(this.path, this.distanceM);
    const noisy = offsetM(here, (gaussian(this.rng) * accuracyM) / 2, (gaussian(this.rng) * accuracyM) / 2);
    const speedKmh = this.speedMps > 0 ? Math.max(0, this.speedMps * 3.6 + gaussian(this.rng) * 0.5) : 0;
    this.reports.push({
      kind: 'location',
      simTimeS: this.simTimeS,
      lat: noisy.lat,
      lng: noisy.lng,
      speedKmh,
      headingDeg: this.headingDeg % 360,
      accuracyM,
    });
  }

  private arriveAtStop(): void {
    const stops = this.path.route.stops;
    const isOrigin = this.nextStopIndex === 0;
    const isTerminus = this.nextStopIndex === stops.length - 1;
    const alighting = isTerminus ? this.passengers : isOrigin ? 0 : Math.round(this.passengers * (0.1 + this.rng() * 0.35));
    this.passengers -= alighting;
    // Passengers for the return leg board at the terminus when looping.
    const startsALeg = isOrigin || (isTerminus && this.loop);
    const boarding = startsALeg ? Math.round(10 + this.rng() * 25) : isTerminus ? 0 : Math.round(this.rng() * 12);
    const boarded = Math.min(boarding, CAPACITY - this.passengers);
    this.passengers += boarded;
    this.phase = 'dwelling';
    this.doorsOpen = true;
    // Terminus includes a layover before the return leg.
    this.dwellRemainingS = 20 + (alighting + boarded) * 1.5 + (isTerminus ? 60 : 0);
    if (!isOrigin) this.stopsServed++;
  }

  private injectFault(fault: FaultId, tyre?: TyrePosition): void {
    if (fault === 'tyre-leak') {
      const position = tyre ?? 'FL';
      if (this.faults.some((f) => f.id === 'tyre-leak' && f.tyre === position)) return;
      this.faults.push({ id: fault, tyre: position, sinceSimS: this.simTimeS });
      return;
    }
    if (this.hasFault(fault)) return;
    this.faults.push({ id: fault, sinceSimS: this.simTimeS });
  }

  /** Clearing a tyre leak is a repair: every leaking tyre is re-inflated. */
  private clearFault(fault: FaultId): void {
    if (fault === 'tyre-leak') {
      for (const tyre of this.tyres) {
        if (this.isLeaking(tyre.position)) tyre.coldKpa = TYRE_NOMINAL_KPA;
      }
    }
    this.faults = this.faults.filter((f) => f.id !== fault);
  }

  private hasFault(fault: FaultId): boolean {
    return this.faults.some((f) => f.id === fault);
  }

  private isLeaking(position: TyrePosition): boolean {
    return this.faults.some((f) => f.id === 'tyre-leak' && f.tyre === position);
  }

  private gpsHasFix(): boolean {
    return !this.hasFault('gps-dropout');
  }

  private loadPct(): number {
    if (!this.running) return 0;
    return Math.max(4, this.throttle * 100);
  }

  private oilPressureKpa(): number {
    if (!this.running) return 0;
    const base = 140 + (330 * (this.rpm - IDLE_RPM)) / (REDLINE_RPM - IDLE_RPM);
    return this.coolantC > 100 ? base * 0.85 : base;
  }

  private tyreState(tyre: TyreInternal): TyreState {
    // Gas law on absolute pressure: a hot tyre reads higher than its cold inflation.
    const hotKpa = (tyre.coldKpa + ATMOSPHERE_KPA) * ((tyre.tempC + 273.15) / (this.ambientC + 273.15)) - ATMOSPHERE_KPA;
    return { position: tyre.position, pressureKpa: hotKpa, tempC: tyre.tempC, leaking: this.isLeaking(tyre.position) };
  }

  private emitStatus(status: 'ONLINE' | 'OFFLINE', reason: string): void {
    this.reports.push({ kind: 'device-status', simTimeS: this.simTimeS, status, reason });
  }

  private warnings(): Warning[] {
    const out: Warning[] = [];
    const fuelPct = (this.fuelL / TANK_L) * 100;
    if (this.fuelL <= 0) out.push({ code: 'FUEL_EMPTY', message: 'Fuel tank empty' });
    else if (fuelPct < LOW_FUEL_PCT) out.push({ code: 'LOW_FUEL', message: `Fuel at ${fuelPct.toFixed(0)}%` });
    if (this.coolantC >= COOLANT_WARN_C) out.push({ code: 'ENGINE_OVERHEAT', message: `Coolant ${this.coolantC.toFixed(0)}°C` });
    if (this.derated) out.push({ code: 'ENGINE_DERATED', message: 'Engine power reduced to protect it from overheating' });
    if (this.ignition && !this.running) out.push({ code: 'ENGINE_STALLED', message: 'Ignition on but engine not running' });
    for (const tyre of this.tyres) {
      if (tyre.coldKpa < TYRE_NOMINAL_KPA * TYRE_LOW_FRACTION) {
        out.push({ code: 'TYRE_PRESSURE_LOW', tyre: tyre.position, message: `Tyre ${tyre.position} under-inflated` });
      }
    }
    if (this.batteryV < BATTERY_LOW_V) out.push({ code: 'BATTERY_LOW', message: `Battery ${this.batteryV.toFixed(1)} V` });
    if (!this.gpsHasFix()) out.push({ code: 'GPS_NO_FIX', message: 'GPS has no fix' });
    return out;
  }
}
