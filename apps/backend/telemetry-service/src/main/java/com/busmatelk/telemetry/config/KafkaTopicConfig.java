package com.busmatelk.telemetry.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

/**
 * Declares the IoT pipeline's Kafka topics (IoT Platform Layer plan, Phase 0). Spring's
 * {@code KafkaAdmin} (auto-configured from {@code spring.kafka.bootstrap-servers}) creates any
 * {@link NewTopic} bean on startup that does not already exist, so bringing the service up against
 * Redpanda is enough to provision them — no manual {@code rpk topic create} step.
 *
 * <p>Topic names and sizing come from {@code telemetry.kafka.*} in application.yml so a single
 * dev-node Redpanda (replication factor 1) and a multi-broker production cluster can differ by
 * config alone. {@code KafkaAdmin} does not fail fast if the broker is unreachable, so the context
 * still boots without a broker (integration tests, broker-down dev) — topic creation simply retries
 * once one is available.
 *
 * <ul>
 *   <li>{@code iot.telemetry.v1} — normalized device telemetry (location, etc.), keyed by deviceId.</li>
 *   <li>{@code iot.device-status.v1} — device lifecycle/health events (online, silent, disabled).</li>
 *   <li>{@code iot.telemetry.dlq.v1} — messages that failed validation/enrichment, with a reason.</li>
 * </ul>
 *
 * <p>Retention (Phase 4 hardening): high-volume raw telemetry is downsampled by time, not kept
 * forever — {@code bus_live_state} (Postgres) is already the durable "latest position" read model,
 * so the topic only needs to bridge live consumers, not serve as a historical store. The DLQ is
 * kept longer since it's low-volume and each message is something a human should look at.
 */
@Configuration
public class KafkaTopicConfig {

    @Value("${telemetry.kafka.topics.telemetry}")
    private String telemetryTopic;

    @Value("${telemetry.kafka.topics.device-status}")
    private String deviceStatusTopic;

    @Value("${telemetry.kafka.topics.dlq}")
    private String dlqTopic;

    @Value("${telemetry.kafka.partitions}")
    private int partitions;

    @Value("${telemetry.kafka.replication-factor}")
    private short replicationFactor;

    @Value("${telemetry.kafka.retention-ms.telemetry}")
    private String telemetryRetentionMs;

    @Value("${telemetry.kafka.retention-ms.device-status}")
    private String deviceStatusRetentionMs;

    @Value("${telemetry.kafka.retention-ms.dlq}")
    private String dlqRetentionMs;

    @Bean
    public NewTopic telemetryTopic() {
        return TopicBuilder.name(telemetryTopic)
                .partitions(partitions)
                .replicas(replicationFactor)
                .config("retention.ms", telemetryRetentionMs)
                .build();
    }

    @Bean
    public NewTopic deviceStatusTopic() {
        return TopicBuilder.name(deviceStatusTopic)
                .partitions(partitions)
                .replicas(replicationFactor)
                .config("retention.ms", deviceStatusRetentionMs)
                .build();
    }

    @Bean
    public NewTopic telemetryDlqTopic() {
        return TopicBuilder.name(dlqTopic)
                .partitions(partitions)
                .replicas(replicationFactor)
                .config("retention.ms", dlqRetentionMs)
                .build();
    }
}
