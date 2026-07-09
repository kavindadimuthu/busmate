package com.busmatelk.backend.operator;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.UUID;

/**
 * Calls core-service's /internal/operators directly — service-to-service, bypassing the
 * API gateway (which 404s /internal/** outright, same as it does for user-service's own
 * /internal/**). Gated by the shared internal.api-key on the receiving end.
 *
 * Every method here throws org.springframework.web.client.RestClientException (its
 * subtypes cover both HTTP error statuses and connect/read timeouts) on any failure —
 * callers (OperatorSyncService) are responsible for catching it and falling back to the
 * outbox. Nothing in this class swallows failures itself.
 */
@Component
public class OperatorSyncClient {

    private final RestTemplate restTemplate;
    private final String coreServiceUrl;
    private final String internalApiKey;

    public OperatorSyncClient(
            @Qualifier("operatorSyncRestTemplate") RestTemplate restTemplate,
            @Value("${core-service.url}") String coreServiceUrl,
            @Value("${internal.api-key}") String internalApiKey) {
        this.restTemplate = restTemplate;
        this.coreServiceUrl = coreServiceUrl;
        this.internalApiKey = internalApiKey;
    }

    public void createOrGetOperator(OperatorSyncPayload payload) {
        exchange(HttpMethod.POST, "/internal/operators", payload);
    }

    public void updateOperator(UUID userId, OperatorSyncPayload payload) {
        exchange(HttpMethod.PATCH, "/internal/operators/by-user/" + userId, payload);
    }

    public void updateStatus(UUID userId, String status) {
        exchange(HttpMethod.PATCH, "/internal/operators/by-user/" + userId + "/status", Map.of("status", status));
    }

    private void exchange(HttpMethod method, String path, Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Internal-Api-Key", internalApiKey);
        restTemplate.exchange(coreServiceUrl + path, method, new HttpEntity<>(body, headers), Void.class);
    }
}
