package com.busmatelk.telemetry.ingest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** Mirrors {@code libs/iot-schemas/schemas/device-status.v1.json}. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeviceStatusPayload {

    @Schema(description = "Device-reported status", example = "ONLINE")
    @NotBlank
    private String status;

    @Schema(description = "Human-readable context for the transition")
    private String reason;

    @Schema(description = "When telemetry was last sent, if the device tracks this itself")
    private Instant lastSeenAt;
}
