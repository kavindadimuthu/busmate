package com.busmatelk.telemetry.vehiclestate.access;

import java.util.UUID;

/**
 * Who is reading vehicle data, reduced to what the database policies need: staff see every operator's
 * buses, an operator sees only their own.
 */
public record VehicleCaller(Kind kind, UUID operatorId) {

    public enum Kind { STAFF, OPERATOR }

    public static VehicleCaller staff() {
        return new VehicleCaller(Kind.STAFF, null);
    }

    public static VehicleCaller operator(UUID operatorId) {
        return new VehicleCaller(Kind.OPERATOR, operatorId);
    }
}
