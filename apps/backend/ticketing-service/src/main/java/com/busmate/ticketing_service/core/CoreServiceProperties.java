package com.busmate.ticketing_service.core;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/** Where core-service lives and the shared secret that opens its /internal/** endpoints. */
@Component
@ConfigurationProperties(prefix = "core-service")
@Getter
@Setter
public class CoreServiceProperties {

    private String baseUrl;

    /** Must match core-service's own {@code internal.api-key}; both read INTERNAL_API_KEY. */
    private String internalApiKey;
}
