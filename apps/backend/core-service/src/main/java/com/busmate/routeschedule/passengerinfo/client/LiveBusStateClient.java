package com.busmate.routeschedule.passengerinfo.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Read-only calls to telemetry-service for FindMyBus's real-time ETA feature (IoT Platform Layer
 * plan, Phase 3). Hits {@code GET /api/live/buses/{busId}}, which telemetry-service's own
 * SecurityConfig permits without authentication — the reverse-direction mirror of telemetry-
 * service's own {@code CoreServiceClient}, which calls back into this service's public
 * {@code GET /api/**} the same way during ingest enrichment.
 *
 * <p>Best-effort: any failure (telemetry-service down, no live state for this bus yet, network
 * error) is swallowed and logged, so real-time ETAs degrade to "not available" (the caller falls
 * back to schedule-based times) rather than failing the whole FindMyBus response.
 */
@Component
@Slf4j
public class LiveBusStateClient {

    private final RestClient restClient;

    public LiveBusStateClient(@Value("${telemetry.service.url}") String telemetryServiceUrl) {
        this.restClient = RestClient.builder().baseUrl(telemetryServiceUrl).build();
    }

    /** Latest known position for a bus, if telemetry-service has any and it's reachable. */
    public Optional<LiveBusState> getLiveState(UUID busId) {
        try {
            LiveBusState state = restClient.get()
                    .uri("/api/live/buses/{busId}", busId)
                    .retrieve()
                    .body(LiveBusState.class);
            return Optional.ofNullable(state);
        } catch (RestClientException e) {
            log.debug("No live state available for bus {} from telemetry-service: {}", busId, e.getMessage());
            return Optional.empty();
        }
    }

    /** Subset of telemetry-service's BusLiveStateResponse — only the fields ETA computation needs. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record LiveBusState(UUID busId, UUID tripId, Double lat, Double lng, Double speedKmh,
                               Double headingDeg, Instant deviceTimestamp, Instant ingestedAt) {
    }
}
