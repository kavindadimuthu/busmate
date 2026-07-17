package com.busmatelk.telemetry;

import org.apache.kafka.clients.admin.AdminClient;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.kafka.core.KafkaAdmin;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Phase 0 foundation test: proves the whole telemetry-service pipeline stands up end to end —
 * <ul>
 *   <li>the Spring context boots against a real Postgres (Testcontainers) with the real Flyway
 *       migrations applied,</li>
 *   <li>the HTTP surface responds,</li>
 *   <li>and the declared Kafka topics are auto-created on a broker (an embedded Kafka here).</li>
 * </ul>
 * This is the migration + broker gate for the new service, mirroring the other services' ITs.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@EmbeddedKafka(partitions = 1, controlledShutdown = true)
@TestPropertySource(properties = "spring.kafka.bootstrap-servers=${spring.embedded.kafka.brokers}")
class TelemetryServiceApplicationIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired
    private TestRestTemplate rest;

    @Autowired
    private Flyway flyway;

    @Autowired
    private KafkaAdmin kafkaAdmin;

    @Test
    void allMigrationsAreAppliedWithNonePending() {
        // Deliberately not pinned to a specific version (V001, V002, …) — new migrations land as
        // the registry grows (Phase 1+); this only asserts Flyway actually ran everything on the
        // classpath against a real Postgres and left nothing pending.
        assertThat(flyway.info().applied()).isNotEmpty();
        assertThat(flyway.info().pending()).isEmpty();
        assertThat(flyway.info().current()).isNotNull();
        assertThat(flyway.info().current().getState().isApplied()).isTrue();
    }

    @Test
    @SuppressWarnings("unchecked")
    void infoEndpointReportsTopics() {
        var response = rest.getForObject("/api/telemetry/info", java.util.Map.class);
        assertThat(response).containsEntry("service", "telemetry-service");
        assertThat(response).containsEntry("status", "ok");
        var topics = (java.util.List<String>) response.get("topics");
        assertThat(topics)
                .containsExactlyInAnyOrder("iot.telemetry.v1", "iot.device-status.v1", "iot.telemetry.dlq.v1");
    }

    @Test
    void declaredKafkaTopicsAreCreated() throws Exception {
        try (AdminClient admin = AdminClient.create(kafkaAdmin.getConfigurationProperties())) {
            Set<String> topics = admin.listTopics().names().get();
            assertThat(topics).contains("iot.telemetry.v1", "iot.device-status.v1", "iot.telemetry.dlq.v1");
        }
    }
}
