package com.busmate.ticketing_service.core;

import com.busmate.ticketing_service.exception.BadRequestException;
import com.busmate.ticketing_service.exception.NotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Reads trip, route and fleet facts from core-service, which owns them (invariant 2 — cross-domain
 * data moves over the API, never by reaching into another service's tables).
 *
 * <p>Calls go directly to core-service's /internal/** surface with the shared key, not through the
 * API gateway: the gateway exists to authenticate end users, and this is one backend asking another
 * a question on no user's behalf.
 */
@Slf4j
@Component
public class CoreServiceClient {

    private final RestClient restClient;

    public CoreServiceClient(CoreServiceProperties properties, RestClient.Builder builder) {
        this.restClient = builder
                .baseUrl(properties.getBaseUrl())
                .defaultHeader("X-Internal-Api-Key", properties.getInternalApiKey())
                .build();
    }

    /**
     * @throws NotFoundException   when no such trip exists
     * @throws BadRequestException when the journey itself is not sensible (a stop that is not on
     *                             the trip's route, or a backwards pair), or core-service cannot
     *                             be reached — a fare must never be guessed when the facts behind
     *                             it are unavailable.
     */
    public BookingContext getBookingContext(String tripId, String fromStopId, String toStopId) {
        try {
            return restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/internal/booking-context/trips/{tripId}")
                            .queryParam("fromStopId", fromStopId)
                            .queryParam("toStopId", toStopId)
                            .build(tripId))
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, (request, response) -> {
                        if (response.getStatusCode().value() == 404) {
                            throw new NotFoundException("Trip not found: " + tripId);
                        }
                        throw new BadRequestException(
                                "This journey cannot be priced: check the boarding and alighting stops");
                    })
                    .body(BookingContext.class);
        } catch (NotFoundException | BadRequestException e) {
            throw e;
        } catch (RestClientException e) {
            log.error("[CoreServiceClient] booking context unavailable for trip {}: {}", tripId, e.toString());
            throw new BadRequestException("Booking is temporarily unavailable - please try again shortly");
        }
    }
}
