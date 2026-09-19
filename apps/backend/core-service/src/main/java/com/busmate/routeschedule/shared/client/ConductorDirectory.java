package com.busmate.routeschedule.shared.client;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import com.busmate.routeschedule.shared.exception.ServiceUnavailableException;

import lombok.extern.slf4j.Slf4j;

/**
 * Conductor accounts live in user-service (identity); core-service only stores their ids on trips
 * and buses. Before recording one, core-service asks user-service which operator the conductor
 * works for and whether the account is active (INC-019/INC-020), over the API-key-gated internal
 * endpoint — never by reading user-service's tables (invariant 2).
 *
 * <p>Fails closed: if user-service cannot be reached the assignment is refused with 503, because
 * recording an unverified conductor is exactly the gap this closes.
 */
@Component
@Slf4j
public class ConductorDirectory {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Conductor(UUID userId, String fullName, String accountStatus, String operatorId) {
        public boolean isActive() {
            return "active".equals(accountStatus);
        }

        public boolean worksFor(UUID operator) {
            return operator != null && operator.toString().equals(operatorId);
        }
    }

    private final RestClient restClient;

    public ConductorDirectory(@Value("${user-service.url}") String userServiceUrl,
                              @Value("${internal.api-key}") String internalApiKey) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(3));
        factory.setReadTimeout(Duration.ofSeconds(5));
        this.restClient = RestClient.builder()
                .baseUrl(userServiceUrl)
                .requestFactory(factory)
                .defaultHeader("X-Internal-Api-Key", internalApiKey)
                .build();
    }

    /** The conductor, or empty when the id is not a conductor account. */
    public Optional<Conductor> find(UUID userId) {
        try {
            return Optional.ofNullable(restClient.get().uri("/internal/conductors/{id}", userId).retrieve().body(Conductor.class));
        } catch (HttpClientErrorException.NotFound e) {
            return Optional.empty();
        } catch (RestClientException e) {
            log.warn("Could not reach user-service to check conductor {}: {}", userId, e.getMessage());
            throw new ServiceUnavailableException("Conductor details could not be checked right now; please try again");
        }
    }
}
