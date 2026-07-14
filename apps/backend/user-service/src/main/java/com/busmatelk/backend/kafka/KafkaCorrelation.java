package com.busmatelk.backend.kafka;

import org.apache.kafka.clients.producer.ProducerRecord;
import org.slf4j.MDC;

import java.nio.charset.StandardCharsets;

/**
 * Observability Phase 1 — correlation id across the async (Kafka) hop.
 *
 * Copies the current request's {@code requestId} (placed in the SLF4J MDC by
 * {@code RequestIdFilter}) onto an outbound Kafka record as a header, so a future
 * consumer can restore it into its own MDC and keep a single correlation id across the
 * gateway → producer → consumer chain. No-ops when there is no request context (e.g. a
 * scheduled job). The header name matches the HTTP header used elsewhere.
 */
public final class KafkaCorrelation {

    public static final String HEADER = "X-Request-Id";

    private KafkaCorrelation() {
    }

    public static void stamp(ProducerRecord<?, ?> record) {
        String requestId = MDC.get("requestId");
        if (requestId != null && !requestId.isBlank()) {
            record.headers().add(HEADER, requestId.getBytes(StandardCharsets.UTF_8));
        }
    }
}
