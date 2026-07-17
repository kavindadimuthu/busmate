package com.busmatelk.telemetry.ingest.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/** Wire shape for {@code POST /ingest/v1/device-status} — see {@link LocationIngestRequest}. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeviceStatusIngestRequest {

    @NotNull
    private Instant deviceTimestamp;

    private UUID tripId;

    @Valid
    @NotNull
    private DeviceStatusPayload payload;
}
