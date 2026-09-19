package com.busmatelk.telemetry.vehiclestate.dto;

import com.busmatelk.telemetry.vehiclestate.entity.BusActiveAlert;
import com.busmatelk.telemetry.vehiclestate.entity.BusVehicleState;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * A bus's latest vehicle health and the alerts it currently holds raised (INC-024). Served only to
 * staff and to the operator that owns the bus, and only through the database's row-level security —
 * never on the open live-position read or stream.
 */
@Getter
@Builder
public class VehicleStateResponse {

    private UUID busId;
    private UUID operatorId;
    private UUID deviceId;
    private UUID tripId;
    private Instant deviceTimestamp;
    private Instant ingestedAt;
    /** The vehicle-telemetry payload exactly as the device reported it. */
    private JsonNode snapshot;
    private List<ActiveAlert> activeAlerts;

    @Getter
    @Builder
    public static class ActiveAlert {
        private String code;
        private String component;
        private String severity;
        private String message;
        private Instant raisedAt;

        static ActiveAlert of(BusActiveAlert alert) {
            return ActiveAlert.builder()
                    .code(alert.getCode())
                    // Stored as '' when the alert has no component (it is part of the key).
                    .component(alert.getComponent().isEmpty() ? null : alert.getComponent())
                    .severity(alert.getSeverity())
                    .message(alert.getMessage())
                    .raisedAt(alert.getRaisedAt())
                    .build();
        }
    }

    public static VehicleStateResponse of(BusVehicleState state, List<BusActiveAlert> alerts) {
        return VehicleStateResponse.builder()
                .busId(state.getBusId())
                .operatorId(state.getOperatorId())
                .deviceId(state.getDeviceId())
                .tripId(state.getTripId())
                .deviceTimestamp(state.getDeviceTimestamp())
                .ingestedAt(state.getIngestedAt())
                .snapshot(state.getSnapshot())
                .activeAlerts(alerts.stream().map(ActiveAlert::of).toList())
                .build();
    }
}
