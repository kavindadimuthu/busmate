package com.busmatelk.telemetry.ingest.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
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

    /**
     * How long a resolved bus-to-operator answer is reused. A snapshot arrives every few seconds per
     * bus, so asking core-service for each one would be most of its traffic; a bus changes operator
     * rarely. The cost is that a bus sold to another operator keeps its old tag for at most this long.
     */
    private static final Duration OPERATOR_TTL = Duration.ofMinutes(5);

    private final RestClient restClient;
    private final String internalApiKey;
    private final Map<UUID, CachedOperator> operatorCache = new ConcurrentHashMap<>();

    public CoreServiceClient(@Value("${core.service.url}") String coreServiceUrl,
                             @Value("${core.service.internal-api-key}") String internalApiKey) {
        this.restClient = RestClient.builder().baseUrl(coreServiceUrl).build();
        this.internalApiKey = internalApiKey;
    }

    /**
     * Which operator owns a bus (INC-023), from core-service's {@code /internal/**} surface, which
     * needs the shared key that the public {@code GET /api/**} calls above do not. Empty when it
     * cannot be resolved — the caller keeps the row untagged rather than dropping the event. Only a
     * successful answer is cached, so an outage is retried on the next event.
     */
    public Optional<UUID> getOperatorIdForBus(UUID busId) {
        CachedOperator cached = operatorCache.get(busId);
        if (cached != null && cached.expiresAt().isAfter(Instant.now())) {
            return Optional.of(cached.operatorId());
        }
        try {
            Map<?, ?> body = restClient.get()
                    .uri("/internal/operators/by-bus/{busId}", busId)
                    .header("X-Internal-Api-Key", internalApiKey)
                    .retrieve()
                    .body(Map.class);
            Object operatorId = body != null ? body.get("operatorId") : null;
            if (operatorId == null) return Optional.empty();
            UUID resolved = UUID.fromString(operatorId.toString());
            operatorCache.put(busId, new CachedOperator(resolved, Instant.now().plus(OPERATOR_TTL)));
            return Optional.of(resolved);
        } catch (RestClientException | IllegalArgumentException e) {
            log.warn("Failed to resolve operator for bus {} from core-service: {}", busId, e.getMessage());
            return Optional.empty();
        }
    }

    private record CachedOperator(UUID operatorId, Instant expiresAt) {
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
