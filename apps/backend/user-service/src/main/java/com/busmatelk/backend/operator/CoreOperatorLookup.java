package com.busmatelk.backend.operator;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

/**
 * Which core-service Operator an operator account runs (INC-019). A conductor's
 * {@code assign_operator_id} holds that Operator's id, so scoping an operator to "their own
 * conductors" needs it. Cached briefly: the link is set once when the operator is created and
 * practically never changes, while conductor screens ask for it on every request.
 */
@Component
public class CoreOperatorLookup {

    private static final Duration TTL = Duration.ofMinutes(5);

    private record Entry(Optional<UUID> operatorId, Instant expires) {}

    private final RestTemplate restTemplate;
    private final String coreServiceUrl;
    private final String internalApiKey;
    private final Map<UUID, Entry> cache = new ConcurrentHashMap<>();

    public CoreOperatorLookup(@Qualifier("operatorSyncRestTemplate") RestTemplate restTemplate,
                              @Value("${core-service.url}") String coreServiceUrl,
                              @Value("${internal.api-key}") String internalApiKey) {
        this.restTemplate = restTemplate;
        this.coreServiceUrl = coreServiceUrl;
        this.internalApiKey = internalApiKey;
    }

    /** The Operator id for this account, or empty when core-service has no linked Operator. */
    public Optional<UUID> operatorIdForUser(UUID userId) {
        Entry cached = cache.get(userId);
        if (cached != null && cached.expires().isAfter(Instant.now())) {
            return cached.operatorId();
        }
        Optional<UUID> result;
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Internal-Api-Key", internalApiKey);
            @SuppressWarnings("unchecked")
            Map<String, Object> body = restTemplate.exchange(coreServiceUrl + "/internal/operators/by-user/" + userId,
                    HttpMethod.GET, new HttpEntity<>(headers), Map.class).getBody();
            result = body != null && body.get("id") != null ? Optional.of(UUID.fromString(body.get("id").toString())) : Optional.empty();
        } catch (HttpClientErrorException.NotFound e) {
            result = Optional.empty();
        }
        cache.put(userId, new Entry(result, Instant.now().plus(TTL)));
        return result;
    }
}
