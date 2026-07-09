package com.busmatelk.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * A dedicated RestTemplate for OperatorSyncClient's direct, service-to-service calls to
 * core-service. Short, explicit timeouts so a core-service outage fails the synchronous
 * call quickly and falls through to the outbox rather than blocking the caller's request
 * thread — same fail-fast rationale as the Kafka producer timeouts in UserEventKafkaConfig.
 */
@Configuration
public class OperatorSyncRestTemplateConfig {

    private static final int CONNECT_TIMEOUT_MS = 2000;
    private static final int READ_TIMEOUT_MS = 3000;

    @Bean
    public RestTemplate operatorSyncRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_MS);
        return new RestTemplate(factory);
    }
}
