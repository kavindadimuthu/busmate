// The model's observable state. Field names and units are chosen so that INC-023's vehicle-telemetry
// payload can be a mapping from these shapes rather than a redesign; nothing here is on the wire yet.

export type DriverProfileId = 'smooth' | 'normal' | 'aggressive';

/** Six wheels: two steer, and dual tyres (outer/inner) on each side of the drive axle. */
export type TyrePosition = 'FL' | 'FR' | 'RLO' | 'RLI' | 'RRI' | 'RRO';
export const TYRE_POSITIONS: readonly TyrePosition[] = ['FL', 'FR', 'RLO', 'RLI', 'RRI', 'RRO'];

export type FaultId = 'tyre-leak' | 'overheat' | 'fuel-leak' | 'gps-dropout';

export type TripPhase = 'dwelling' | 'driving' | 'arrived';

export interface EngineState {
  running: boolean;
  rpm: number;
  gear: number;
  loadPct: number;
  coolantTempC: number;
  oilPressureKpa: number;
  hours: number;
  /** Power cut to protect an overheating engine. */
  derated: boolean;
}

export interface MotionState {
  speedKmh: number;
  accelMps2: number;
  odometerKm: number;
  headingDeg: number;
  /** True position — what the bus is actually doing, independent of whether GPS can see it. */
  lat: number;
  lng: number;
  throttlePct: number;
  brakePct: number;
}

export interface FuelState {
  levelL: number;
  capacityL: number;
  levelPct: number;
  rateLph: number;
}

export interface ElectricalState {
  batteryV: number;
  charging: boolean;
}

export interface TyreState {
  position: TyrePosition;
  pressureKpa: number;
  tempC: number;
  leaking: boolean;
}

export interface CabinState {
  doorsOpen: boolean;
  passengers: number;
  capacity: number;
}

export interface TripState {
  routeId: string;
  routeName: string;
  phase: TripPhase;
  /** true on the return leg when looping. */
  reversed: boolean;
  distanceM: number;
  totalM: number;
  /** Index into the stop list in the current direction. */
  nextStopIndex: number;
  nextStopName: string | null;
  distanceToNextStopM: number | null;
  dwellRemainingS: number;
  stopsServed: number;
}

export interface GpsState {
  fix: boolean;
  lat: number | null;
  lng: number | null;
  accuracyM: number | null;
}

export interface ActiveFault {
  id: FaultId;
  tyre?: TyrePosition;
  sinceSimS: number;
}

export type WarningCode =
  | 'LOW_FUEL'
  | 'FUEL_EMPTY'
  | 'ENGINE_OVERHEAT'
  | 'ENGINE_DERATED'
  | 'ENGINE_STALLED'
  | 'TYRE_PRESSURE_LOW'
  | 'BATTERY_LOW'
  | 'GPS_NO_FIX';

export interface Warning {
  code: WarningCode;
  /** Set for per-tyre warnings. */
  tyre?: TyrePosition;
  message: string;
}

export interface VehicleState {
  simTimeS: number;
  ignition: boolean;
  driverProfile: DriverProfileId;
  speedLimitKmh: number | null;
  engine: EngineState;
  motion: MotionState;
  fuel: FuelState;
  electrical: ElectricalState;
  tyres: TyreState[];
  cabin: CabinState;
  trip: TripState;
  gps: GpsState;
  faults: ActiveFault[];
  warnings: Warning[];
}

/** Mirrors libs/iot-schemas/schemas/vehicle-telemetry.v1.json — what a unit sends about the vehicle. */
export interface VehicleTelemetryPayload {
  ignition: boolean;
  odometerKm: number;
  engine: {
    running: boolean;
    rpm: number;
    gear: number;
    loadPct: number;
    coolantTempC: number;
    oilPressureKpa: number;
    hours: number;
    derated: boolean;
  };
  fuel: { levelPct: number; levelL: number; rateLph: number };
  electrical: { batteryV: number; charging: boolean };
  tyres: Array<{ position: TyrePosition; pressureKpa: number; tempC: number }>;
  cabin: { doorsOpen: boolean; passengers: number };
}

export type AlertSeverity = 'info' | 'warning' | 'critical';

/** What a tracker would report. Produced on the model's own cadence so it is part of the deterministic output. */
export type Report =
  | {
      kind: 'location';
      simTimeS: number;
      lat: number;
      lng: number;
      speedKmh: number;
      headingDeg: number;
      accuracyM: number;
    }
  | {
      kind: 'device-status';
      simTimeS: number;
      status: 'ONLINE' | 'OFFLINE';
      reason: string;
    }
  | { kind: 'vehicle-telemetry'; simTimeS: number; payload: VehicleTelemetryPayload }
  | {
      kind: 'alert';
      simTimeS: number;
      code: WarningCode;
      state: 'raised' | 'cleared';
      severity: AlertSeverity;
      /** The tyre, for a per-tyre warning. Together with `code` it identifies the alert. */
      component?: TyrePosition;
      message: string;
    };

export type Command =
  | { type: 'setIgnition'; on: boolean }
  | { type: 'setDriverProfile'; profile: DriverProfileId }
  /** Caps the driver's target speed; null removes the cap. */
  | { type: 'setSpeedLimit'; kmh: number | null }
  | { type: 'injectFault'; fault: FaultId; tyre?: TyrePosition }
  | { type: 'clearFault'; fault: FaultId }
  | { type: 'setFuelLevel'; pct: number }
  | { type: 'restartTrip' };
