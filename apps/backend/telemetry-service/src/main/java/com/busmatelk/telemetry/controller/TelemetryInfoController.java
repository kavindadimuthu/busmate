package com.busmatelk.telemetry.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Minimal liveness/info surface for the telemetry service (Phase 0 scaffold). Confirms the service
 * is up and reports the Kafka topics it owns. Ingestion, device-registry, and live-state endpoints
 * arrive in later phases.
 */
@RestController
@RequestMapping("/api/telemetry")
public class TelemetryInfoController {

    @Value("${telemetry.kafka.topics.telemetry}")
    private String telemetryTopic;

    @Value("${telemetry.kafka.topics.device-status}")
    private String deviceStatusTopic;

    @Value("${telemetry.kafka.topics.dlq}")
    private String dlqTopic;

    @GetMapping("/info")
    public Map<String, Object> info() {
        return Map.of(
                "service", "telemetry-service",
                "status", "ok",
                "topics", List.of(telemetryTopic, deviceStatusTopic, dlqTopic)
        );
    }
}
