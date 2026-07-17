package com.busmatelk.telemetry.mqtt;

import com.busmatelk.telemetry.ingest.IngestService;
import com.busmatelk.telemetry.ingest.dto.DeviceStatusIngestRequest;
import com.busmatelk.telemetry.ingest.dto.LocationIngestRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.annotation.PreDestroy;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.paho.client.mqttv3.MqttCallback;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.UUID;

/**
 * MQTT ingestion adapter (IoT Platform Layer plan, Phase 4) — the second protocol adapter
 * alongside Phase 2's HTTPS controller, feeding the exact same {@link IngestService} pipeline
 * (validate → enrich → publish → upsert). Devices publish to {@code devices/{deviceId}/telemetry/
 * {eventType}} (QoS 1); {@link MqttAuthController} is what actually authenticates them at the
 * broker — by the time a message reaches this subscriber, EMQX has already rejected any
 * unauthenticated publisher, so the deviceId embedded in the topic is trusted the same way the
 * HTTPS path trusts the deviceId {@code DeviceTokenAuthenticationFilter} resolves from the token.
 *
 * <p>Connects with its own backend credentials (a superuser entry in EMQX's built-in database
 * authenticator, layered <em>before</em> the HTTP-hook authenticator — see
 * {@code config/mqtt/emqx.conf} — so this subscriber's connection never depends on the device
 * registry). Best-effort like every other cross-process integration in this service: a broker
 * that isn't reachable yet logs a warning and retries on a delay rather than failing service
 * startup, since MQTT is one of two ingestion transports, not a hard dependency.
 */
@Component
@Slf4j
public class MqttIngestAdapter implements MqttCallback {

    private static final String TOPIC_FILTER = "devices/+/telemetry/+";
    private static final int QOS = 1;
    private static final long RECONNECT_DELAY_MS = 10_000;

    private final IngestService ingestService;
    private final ObjectMapper objectMapper;
    private final Validator validator;
    private final MeterRegistry meterRegistry;

    private final boolean enabled;
    private final String brokerUrl;
    private final String clientId;
    private final String username;
    private final String password;

    private MqttClient client;
    private volatile boolean shuttingDown = false;

    public MqttIngestAdapter(
            IngestService ingestService,
            ObjectMapper objectMapper,
            Validator validator,
            MeterRegistry meterRegistry,
            @Value("${telemetry.mqtt.enabled:false}") boolean enabled,
            @Value("${telemetry.mqtt.broker-url:tcp://localhost:1883}") String brokerUrl,
            @Value("${telemetry.mqtt.client-id:telemetry-service-consumer}") String clientId,
            @Value("${telemetry.mqtt.username:telemetry-service-consumer}") String username,
            @Value("${telemetry.mqtt.password:}") String password) {
        this.ingestService = ingestService;
        this.objectMapper = objectMapper;
        this.validator = validator;
        this.meterRegistry = meterRegistry;
        this.enabled = enabled;
        this.brokerUrl = brokerUrl;
        this.clientId = clientId;
        this.username = username;
        this.password = password;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void connect() {
        if (!enabled) {
            log.info("MQTT ingestion adapter disabled (telemetry.mqtt.enabled=false)");
            return;
        }
        new Thread(this::connectWithRetry, "mqtt-ingest-connect").start();
    }

    private void connectWithRetry() {
        while (!shuttingDown) {
            try {
                client = new MqttClient(brokerUrl, clientId, new MemoryPersistence());
                client.setCallback(this);
                MqttConnectOptions options = new MqttConnectOptions();
                options.setUserName(username);
                options.setPassword(password.toCharArray());
                options.setAutomaticReconnect(true);
                options.setCleanSession(true);
                options.setConnectionTimeout(10);
                client.connect(options);
                client.subscribe(TOPIC_FILTER, QOS);
                log.info("MQTT ingest adapter connected to {} and subscribed to {}", brokerUrl, TOPIC_FILTER);
                return;
            } catch (Exception e) {
                log.warn("MQTT broker connection failed ({}); retrying in {}ms", e.getMessage(), RECONNECT_DELAY_MS);
                sleep(RECONNECT_DELAY_MS);
            }
        }
    }

    @Override
    public void connectionLost(Throwable cause) {
        log.warn("MQTT connection lost: {} — Paho's automatic reconnect will retry", cause.getMessage());
    }

    @Override
    public void messageArrived(String topic, MqttMessage message) {
        try {
            handleMessage(topic, message);
        } catch (Exception e) {
            // A single malformed/unparseable message must never take down the subscriber thread —
            // every other device's messages still need to arrive.
            log.warn("Failed to process MQTT message on topic {}: {}", topic, e.getMessage());
            meterRegistry.counter("telemetry.ingest.events", "eventType", "unknown", "adapter", "mqtt", "outcome", "parse_error")
                    .increment();
        }
    }

    private void handleMessage(String topic, MqttMessage message) throws Exception {
        String[] parts = topic.split("/");
        // devices/{deviceId}/telemetry/{eventType}
        if (parts.length != 4 || !"devices".equals(parts[0]) || !"telemetry".equals(parts[2])) {
            log.warn("Ignoring MQTT message on unexpected topic shape: {}", topic);
            return;
        }
        UUID deviceId = UUID.fromString(parts[1]);
        String eventType = parts[3];
        byte[] payload = message.getPayload();

        switch (eventType) {
            case "location" -> {
                LocationIngestRequest request = objectMapper.readValue(payload, LocationIngestRequest.class);
                requireValid(request);
                ingestService.ingestLocation(deviceId, request, IngestService.ADAPTER_MQTT);
            }
            case "device-status" -> {
                DeviceStatusIngestRequest request = objectMapper.readValue(payload, DeviceStatusIngestRequest.class);
                requireValid(request);
                ingestService.ingestDeviceStatus(deviceId, request, IngestService.ADAPTER_MQTT);
            }
            default -> log.warn("Ignoring MQTT message with unknown eventType '{}' on topic {}", eventType, topic);
        }
    }

    /** MQTT messages bypass Spring MVC's @Valid, so Bean Validation is applied by hand here — same
     * constraints the HTTPS DTOs declare, just invoked directly instead of via the framework. */
    private <T> void requireValid(T request) {
        Set<ConstraintViolation<T>> violations = validator.validate(request);
        if (!violations.isEmpty()) {
            throw new IllegalArgumentException("Invalid MQTT payload: " + violations);
        }
    }

    @Override
    public void deliveryComplete(org.eclipse.paho.client.mqttv3.IMqttDeliveryToken token) {
        // No-op: this adapter only subscribes, never publishes.
    }

    @PreDestroy
    void shutdown() {
        shuttingDown = true;
        if (client != null && client.isConnected()) {
            try {
                client.disconnect();
            } catch (Exception e) {
                log.warn("Error disconnecting MQTT client: {}", e.getMessage());
            }
        }
    }

    private static void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
