package com.busmatelk.telemetry.fleethealth;

import com.busmatelk.telemetry.device.entity.Device;
import com.busmatelk.telemetry.device.entity.DeviceStatus;
import com.busmatelk.telemetry.device.repository.DeviceRepository;
import com.busmatelk.telemetry.ingest.EventEnvelope;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Fleet health (IoT Platform Layer plan, Phase 3): flags an ACTIVE device as "silent" once it has
 * gone longer than {@code telemetry.fleet-health.silence-threshold-minutes} without any ingest
 * call touching {@code device.last_seen_at}, and clears the flag automatically the next time it
 * reports. Both transitions are published as server-originated {@code device-status} events on the
 * same topic devices themselves publish to (Phase 2's {@code /ingest/v1/device-status}), so any
 * consumer (the api-gateway SSE stream, in Phase 3) sees one unified device-status feed regardless
 * of whether the event came from the device or from this job.
 *
 * <p>Single-instance job (no distributed lock) — fine at this scale, same caveat as
 * {@code DeviceRateLimiter}. If telemetry-service is ever scaled horizontally, guard this with a
 * leader-election or DB-advisory-lock mechanism to avoid duplicate flag/publish races.
 */
@Component
@Slf4j
public class FleetHealthMonitorJob {

    private static final int ENVELOPE_VERSION = 1;
    private static final int SCHEMA_VERSION = 1;
    private static final String ADAPTER = "system";

    private final DeviceRepository deviceRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final String deviceStatusTopic;
    private final Duration silenceThreshold;
    private final String gatewayId;

    public FleetHealthMonitorJob(
            DeviceRepository deviceRepository,
            KafkaTemplate<String, Object> kafkaTemplate,
            @Value("${telemetry.kafka.topics.device-status}") String deviceStatusTopic,
            @Value("${telemetry.fleet-health.silence-threshold-minutes}") long silenceThresholdMinutes) {
        this.deviceRepository = deviceRepository;
        this.kafkaTemplate = kafkaTemplate;
        this.deviceStatusTopic = deviceStatusTopic;
        this.silenceThreshold = Duration.ofMinutes(silenceThresholdMinutes);
        this.gatewayId = resolveGatewayId();
    }

    @Scheduled(fixedDelayString = "${telemetry.fleet-health.check-interval-ms}")
    public void checkFleetHealth() {
        Instant now = Instant.now();

        List<Device> goneSilent = deviceRepository
                .findByStatusAndLastSeenAtBeforeAndSilenceFlaggedAtIsNull(DeviceStatus.ACTIVE, now.minus(silenceThreshold));
        for (Device device : goneSilent) {
            device.setSilenceFlaggedAt(now);
            deviceRepository.save(device);
            publishStatusEvent(device, "device-silent", now);
            log.warn("Device {} ({}) flagged silent — last seen {}", device.getId(), device.getSerialNumber(), device.getLastSeenAt());
        }

        List<Device> recovered = deviceRepository.findRecoveredSinceFlagged();
        for (Device device : recovered) {
            device.setSilenceFlaggedAt(null);
            deviceRepository.save(device);
            publishStatusEvent(device, "device-recovered", now);
            log.info("Device {} ({}) recovered — last seen {}", device.getId(), device.getSerialNumber(), device.getLastSeenAt());
        }
    }

    private void publishStatusEvent(Device device, String status, Instant now) {
        EventEnvelope envelope = new EventEnvelope(
                ENVELOPE_VERSION, UUID.randomUUID(), "device-status", SCHEMA_VERSION,
                device.getId(), null, null,
                device.getLastSeenAt(), now, null,
                new EventEnvelope.Source(ADAPTER, gatewayId),
                Map.of("status", status, "lastSeenAt", String.valueOf(device.getLastSeenAt())));
        try {
            kafkaTemplate.send(deviceStatusTopic, device.getId().toString(), envelope).get(3, TimeUnit.SECONDS);
        } catch (Exception e) {
            // Best-effort: a missed fleet-health notification isn't worth failing the scheduled
            // run over — the flag itself is already persisted, and the next tick's state is
            // computed fresh from the DB regardless of whether this publish succeeded.
            log.warn("Failed to publish {} event for device {}", status, device.getId(), e);
        }
    }

    private static String resolveGatewayId() {
        try {
            return InetAddress.getLocalHost().getHostName();
        } catch (UnknownHostException e) {
            return "telemetry-service";
        }
    }
}
