package com.busmatelk.telemetry.ingest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Wire shape for {@code POST /ingest/v1/vehicle-telemetry}. Like {@link DeviceStatusIngestRequest}
 * it carries no {@code sequenceNo}: the per-device counter is shared with location events, and a
 * snapshot that arrived late is handled by its device timestamp instead.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleTelemetryIngestRequest {

    @Schema(description = "Device-clock timestamp of this snapshot")
    @NotNull
    private Instant deviceTimestamp;

    @Schema(description = "Active trip hint, resolved the same way a location fix's is")
    private UUID tripId;

    @Valid
    @NotNull
    private VehicleTelemetryPayload payload;
}
