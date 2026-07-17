package com.busmatelk.telemetry.ingest;

import java.time.Instant;
import java.util.UUID;

/**
 * Published to {@code iot.telemetry.dlq.v1} for events that are syntactically valid (passed Bean
 * Validation) but were flagged by a plausibility check — e.g. a GPS fix too imprecise or a speed
 * no bus could plausibly reach (see {@code IngestService.PLAUSIBILITY}). Never silently dropped:
 * every flagged event is fully preserved here, reason included, for later inspection.
 */
public record DlqRecord(
        UUID eventId,
        String eventType,
        UUID deviceId,
        UUID busId,
        UUID tripId,
        String reason,
        Instant deviceTimestamp,
        Instant ingestedAt,
        Object payload
) {
}
