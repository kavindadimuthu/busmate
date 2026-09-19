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
 * Account facts only user-service holds — for INC-029, whether a passenger's email is verified — read
 * over the API-key-gated internal endpoint, never from user-service's tables (invariant 2). Fails
 * closed: when user-service cannot be reached the caller is refused, not assumed verified.
 */
@Component
@Slf4j
public class AccountDirectory {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Account(UUID userId, String userType, String accountStatus, Boolean emailVerified) {
        public boolean isVerifiedActivePassenger() {
            return "passenger".equalsIgnoreCase(userType) && "active".equals(accountStatus)
                    && Boolean.TRUE.equals(emailVerified);
        }
    }

    private final RestClient restClient;

    public AccountDirectory(@Value("${user-service.url}") String userServiceUrl,
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

    public Optional<Account> find(UUID userId) {
        try {
            return Optional.ofNullable(restClient.get().uri("/internal/users/{id}", userId).retrieve().body(Account.class));
        } catch (HttpClientErrorException.NotFound e) {
            return Optional.empty();
        } catch (RestClientException e) {
            log.warn("Could not reach user-service to check account {}: {}", userId, e.getMessage());
            throw new ServiceUnavailableException("Your account could not be checked right now; please try again");
        }
    }
}
