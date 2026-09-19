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

/** Wire shape for {@code POST /ingest/v1/alert} (INC-023). */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertIngestRequest {

    @Schema(description = "Device-clock timestamp of when the condition was raised or cleared")
    @NotNull
    private Instant deviceTimestamp;

    @Schema(description = "Active trip hint, resolved the same way a location fix's is")
    private UUID tripId;

    @Valid
    @NotNull
    private AlertPayload payload;
}
