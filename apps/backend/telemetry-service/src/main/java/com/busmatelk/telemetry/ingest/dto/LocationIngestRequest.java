package com.busmatelk.telemetry.ingest.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Wire shape for {@code POST /ingest/v1/location}. Deliberately smaller than the internal
 * {@link com.busmatelk.telemetry.ingest.EventEnvelope}: a device only knows its own clock, an
 * optional trip hint, and the fix itself — everything else (deviceId, busId, ingestedAt, source)
 * is derived server-side during enrichment, never trusted from the wire.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LocationIngestRequest {

    @Schema(description = "Device-clock timestamp of this fix")
    @NotNull
    private Instant deviceTimestamp;

    @Schema(description = "Monotonic per-device counter, if the device tracks one")
    @PositiveOrZero
    private Long sequenceNo;

    @Schema(description = "Active trip hint (e.g. from the conductor app's own trip context). " +
            "When present, busId is resolved from this trip rather than from the device's " +
            "static bus assignment — lets a device without a fixed installation (like a phone) " +
            "still resolve the right bus for whichever trip it's currently reporting for.")
    private UUID tripId;

    @Valid
    @NotNull
    private LocationPayload payload;
}
