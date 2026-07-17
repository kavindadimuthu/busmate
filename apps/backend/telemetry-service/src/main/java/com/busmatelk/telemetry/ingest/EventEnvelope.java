package com.busmatelk.telemetry.ingest;

import java.time.Instant;
import java.util.UUID;

/**
 * Java mirror of {@code libs/iot-schemas/schemas/envelope.v1.json} — the shape every normalized
 * device event carries on {@code iot.telemetry.v1} / {@code iot.device-status.v1}. Published as
 * JSON via the telemetry Kafka template's {@code JsonSerializer}; field names match the schema
 * exactly (Jackson serializes record accessors as the same-named JSON properties), so a consumer
 * validating against that schema sees the same shape. Kept in sync by hand — see that file's
 * README for the versioning rules this must follow.
 */
public record EventEnvelope(
        int envelopeVersion,
        UUID eventId,
        String eventType,
        int schemaVersion,
        UUID deviceId,
        UUID busId,
        UUID tripId,
        Instant deviceTimestamp,
        Instant ingestedAt,
        Long sequenceNo,
        Source source,
        Object payload
) {
    public record Source(String adapter, String gateway) {
    }
}
