package com.busmatelk.telemetry.ingest.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Read-only calls to core-service for trip enrichment during ingest (IoT Platform Layer plan,
 * Phase 2). Every call here hits {@code GET /api/**}, which core-service's own SecurityConfig
 * permits without authentication (see {@code SecurityConfig.requestMatchers(HttpMethod.GET,
 * "/api/**").permitAll()}) — the same convention other direct service-to-service calls in this
 * codebase already rely on, so no internal API key or token is needed here.
 *
 * <p>Enrichment is best-effort: any failure (core-service down, trip not found, network error) is
 * swallowed and logged rather than propagated, so a core-service outage degrades ingestion to
 * "no tripId/busId resolved" instead of rejecting telemetry outright.
 */
@Component
@Slf4j
public class CoreServiceClient {

    /** Trip states a device's fix can plausibly belong to "right now". */
    private static final Set<String> ACTIVE_TRIP_STATUSES = Set.of("active", "in_transit", "boarding", "departed");

    private final RestClient restClient;

    public CoreServiceClient(@Value("${core.service.url}") String coreServiceUrl) {
        this.restClient = RestClient.builder().baseUrl(coreServiceUrl).build();
    }

    /** Resolves a trip by id, returning its busId if the trip exists and core-service is reachable. */
    public Optional<TripSummary> getTripById(UUID tripId) {
        try {
            TripSummary trip = restClient.get()
                    .uri("/api/trips/{id}", tripId)
                    .retrieve()
                    .body(TripSummary.class);
            return Optional.ofNullable(trip);
        } catch (RestClientException e) {
            log.warn("Failed to resolve trip {} from core-service: {}", tripId, e.getMessage());
            return Optional.empty();
        }
    }

    /** Best-effort lookup of the bus's currently-active trip (today, in an in-progress status). */
    public Optional<TripSummary> findActiveTripForBus(UUID busId) {
        try {
            List<TripSummary> trips = restClient.get()
                    .uri("/api/trips/bus/{busId}", busId)
                    .retrieve()
                    .body(new org.springframework.core.ParameterizedTypeReference<List<TripSummary>>() {});
            if (trips == null) return Optional.empty();

            LocalDate today = LocalDate.now();
            return trips.stream()
                    .filter(t -> today.equals(t.tripDate()))
                    .filter(t -> t.status() != null && ACTIVE_TRIP_STATUSES.contains(t.status().toLowerCase()))
                    .findFirst();
        } catch (RestClientException e) {
            log.warn("Failed to resolve active trip for bus {} from core-service: {}", busId, e.getMessage());
            return Optional.empty();
        }
    }

    /** Subset of core-service's TripResponse — only the fields ingest enrichment needs. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record TripSummary(UUID id, UUID busId, LocalDate tripDate, String status) {
    }
}
