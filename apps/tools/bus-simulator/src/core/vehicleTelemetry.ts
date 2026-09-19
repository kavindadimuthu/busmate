import type { AlertSeverity, VehicleState, VehicleTelemetryPayload, WarningCode } from './types.ts';

const round = (v: number, places: number) => Math.round(v * 10 ** places) / 10 ** places;

/**
 * Maps the model's state onto the published vehicle-telemetry payload (INC-025). Pure, so what a
 * bus sends is part of the model's deterministic, testable output. Passenger figures stay counts.
 */
export function toVehicleTelemetry(v: VehicleState): VehicleTelemetryPayload {
  return {
    ignition: v.ignition,
    odometerKm: round(v.motion.odometerKm, 1),
    engine: {
      running: v.engine.running,
      rpm: Math.round(v.engine.rpm),
      gear: v.engine.gear,
      loadPct: round(v.engine.loadPct, 1),
      coolantTempC: round(v.engine.coolantTempC, 1),
      oilPressureKpa: round(v.engine.oilPressureKpa, 0),
      hours: round(v.engine.hours, 2),
      derated: v.engine.derated,
    },
    fuel: { levelPct: round(v.fuel.levelPct, 1), levelL: round(v.fuel.levelL, 1), rateLph: round(v.fuel.rateLph, 1) },
    electrical: { batteryV: round(v.electrical.batteryV, 2), charging: v.electrical.charging },
    tyres: v.tyres.map((t) => ({ position: t.position, pressureKpa: round(t.pressureKpa, 0), tempC: round(t.tempC, 1) })),
    cabin: { doorsOpen: v.cabin.doorsOpen, passengers: v.cabin.passengers },
  };
}

/** How serious each condition is. Critical means the bus should not carry on as it is. */
export const ALERT_SEVERITY: Record<WarningCode, AlertSeverity> = {
  LOW_FUEL: 'warning',
  FUEL_EMPTY: 'critical',
  ENGINE_OVERHEAT: 'critical',
  ENGINE_DERATED: 'warning',
  ENGINE_STALLED: 'critical',
  TYRE_PRESSURE_LOW: 'warning',
  BATTERY_LOW: 'warning',
  GPS_NO_FIX: 'info',
};
