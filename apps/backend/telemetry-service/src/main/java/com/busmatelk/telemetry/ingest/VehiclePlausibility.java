package com.busmatelk.telemetry.ingest;

import com.busmatelk.telemetry.ingest.dto.VehicleTelemetryPayload;

import java.util.List;

/**
 * Well-formed but physically absurd vehicle readings (INC-023). A snapshot that fails here is routed
 * to the dead-letter topic with the reason and never touches stored state — the same treatment an
 * implausible location fix gets. The bounds are deliberately generous: they catch a unit reporting
 * nonsense (a stuck sensor, a unit mix-up), not an engine that is genuinely in trouble, which is
 * precisely what fleet health wants to see.
 */
final class VehiclePlausibility {

    private static final double COOLANT_MIN_C = -40;
    private static final double COOLANT_MAX_C = 200;
    private static final double TYRE_TEMP_MIN_C = -60;
    private static final double TYRE_TEMP_MAX_C = 250;
    private static final double TYRE_PRESSURE_MAX_KPA = 2_000;
    private static final double OIL_PRESSURE_MAX_KPA = 2_000;
    private static final int RPM_MAX = 6_000;
    private static final double BATTERY_MAX_V = 60;
    private static final double ODOMETER_MAX_KM = 5_000_000;
    private static final double FUEL_RATE_MAX_LPH = 500;
    private static final double ENGINE_HOURS_MAX = 200_000;
    private static final int PASSENGERS_MAX = 250;

    private VehiclePlausibility() {
    }

    /** The first implausible reading found, or null if every reading is plausible. */
    static String issue(VehicleTelemetryPayload p) {
        if (p.getOdometerKm() != null && p.getOdometerKm() > ODOMETER_MAX_KM) {
            return "odometer %.0fkm exceeds plausible max %.0fkm".formatted(p.getOdometerKm(), ODOMETER_MAX_KM);
        }
        var engine = p.getEngine();
        if (engine != null) {
            if (engine.getCoolantTempC() != null
                    && (engine.getCoolantTempC() < COOLANT_MIN_C || engine.getCoolantTempC() > COOLANT_MAX_C)) {
                return "coolant temperature %.0fC outside plausible range".formatted(engine.getCoolantTempC());
            }
            if (engine.getRpm() != null && engine.getRpm() > RPM_MAX) {
                return "engine speed %drpm exceeds plausible max %drpm".formatted(engine.getRpm(), RPM_MAX);
            }
            if (engine.getOilPressureKpa() != null && engine.getOilPressureKpa() > OIL_PRESSURE_MAX_KPA) {
                return "oil pressure %.0fkPa exceeds plausible max".formatted(engine.getOilPressureKpa());
            }
            if (engine.getHours() != null && engine.getHours() > ENGINE_HOURS_MAX) {
                return "engine hours %.0f exceeds plausible max".formatted(engine.getHours());
            }
        }
        var fuel = p.getFuel();
        if (fuel != null && fuel.getRateLph() != null && fuel.getRateLph() > FUEL_RATE_MAX_LPH) {
            return "fuel rate %.0fL/h exceeds plausible max".formatted(fuel.getRateLph());
        }
        var electrical = p.getElectrical();
        if (electrical != null && electrical.getBatteryV() != null && electrical.getBatteryV() > BATTERY_MAX_V) {
            return "battery %.1fV exceeds plausible max".formatted(electrical.getBatteryV());
        }
        List<VehicleTelemetryPayload.Tyre> tyres = p.getTyres();
        if (tyres != null) {
            for (var tyre : tyres) {
                if (tyre.getPressureKpa() != null && tyre.getPressureKpa() > TYRE_PRESSURE_MAX_KPA) {
                    return "tyre %s pressure %.0fkPa exceeds plausible max".formatted(tyre.getPosition(), tyre.getPressureKpa());
                }
                if (tyre.getTempC() != null && (tyre.getTempC() < TYRE_TEMP_MIN_C || tyre.getTempC() > TYRE_TEMP_MAX_C)) {
                    return "tyre %s temperature %.0fC outside plausible range".formatted(tyre.getPosition(), tyre.getTempC());
                }
            }
        }
        var cabin = p.getCabin();
        if (cabin != null && cabin.getPassengers() != null && cabin.getPassengers() > PASSENGERS_MAX) {
            return "%d passengers exceeds plausible max %d".formatted(cabin.getPassengers(), PASSENGERS_MAX);
        }
        return null;
    }
}
