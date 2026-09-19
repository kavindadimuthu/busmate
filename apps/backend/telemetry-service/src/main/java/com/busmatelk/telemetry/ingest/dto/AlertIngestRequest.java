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

/**
 * Wire shape for {@code POST /ingest/v1/alert} (INC-023). No trip hint, for the same reason as
 * {@link VehicleTelemetryIngestRequest}: an alert belongs to the bus the device is installed in.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertIngestRequest {

    @Schema(description = "Device-clock timestamp of when the condition was raised or cleared")
    @NotNull
    private Instant deviceTimestamp;


    @Valid
    @NotNull
    private AlertPayload payload;
}
