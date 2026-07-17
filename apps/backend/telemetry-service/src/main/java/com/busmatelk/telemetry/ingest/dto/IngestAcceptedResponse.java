package com.busmatelk.telemetry.ingest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * Response for every accepted ingest call, whether the event was published normally or flagged to
 * the DLQ — both are 202 (the device did nothing wrong that it could fix; see IngestService).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IngestAcceptedResponse {
    private UUID eventId;
    /** "accepted" (published to the main topic) or "flagged" (routed to the DLQ instead). */
    private String status;
    private String reason;
}
