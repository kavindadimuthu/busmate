package com.busmatelk.telemetry.ingest;

import com.busmatelk.telemetry.device.entity.Device;
import com.busmatelk.telemetry.device.entity.DeviceStatus;
import com.busmatelk.telemetry.device.repository.DeviceAssignmentRepository;
import com.busmatelk.telemetry.device.repository.DeviceRepository;
import com.busmatelk.telemetry.ingest.client.CoreServiceClient;
import com.busmatelk.telemetry.ingest.dto.DeviceStatusIngestRequest;
import com.busmatelk.telemetry.ingest.dto.IngestAcceptedResponse;
import com.busmatelk.telemetry.ingest.dto.LocationIngestRequest;
import com.busmatelk.telemetry.livestate.entity.BusLiveState;
import com.busmatelk.telemetry.livestate.repository.BusLiveStateRepository;
import com.busmatelk.telemetry.shared.exception.NotFoundException;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Ingest pipeline (IoT Platform Layer plan, Phase 2): validate → enrich (busId, active tripId) →
 * publish the normalized envelope to Kafka → upsert the live-state read model. Implausible-but-
 * well-formed events are routed to the DLQ instead of the main topic, with a reason, and never
 * silently dropped.
 *
 * <p><b>Known simplification:</b> the Kafka publish (a blocking network round-trip, so the caller
 * gets a definitive ack before its 202) and the two DB writes that follow it (device last-seen,
 * bus_live_state upsert) are not wrapped in one atomic transaction — each is its own. A crash
 * between them could leave last_seen_at updated without a matching live-state row, which self-heals
 * on the next successful ingest. Tightening this (e.g. an outbox pattern) is flagged as a Phase 4
 * hardening item in the plan doc, not attempted here.
 */
@Service
@Slf4j
public class IngestService {

    private static final int ENVELOPE_VERSION = 1;
    private static final int SCHEMA_VERSION = 1;
    /** Default adapter for the HTTPS ingest path (Phase 2); the MQTT adapter (Phase 4) passes its own. */
    public static final String ADAPTER_HTTPS = "https";
    public static final String ADAPTER_MQTT = "mqtt";

    private final DeviceRepository deviceRepository;
    private final DeviceAssignmentRepository assignmentRepository;
    private final BusLiveStateRepository liveStateRepository;
    private final CoreServiceClient coreServiceClient;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final MeterRegistry meterRegistry;

    private final String telemetryTopic;
    private final String deviceStatusTopic;
    private final String dlqTopic;
    private final double maxSpeedKmh;
    private final double maxAccuracyM;
    private final String gatewayId;

    public IngestService(
            DeviceRepository deviceRepository,
            DeviceAssignmentRepository assignmentRepository,
            BusLiveStateRepository liveStateRepository,
            CoreServiceClient coreServiceClient,
            KafkaTemplate<String, Object> kafkaTemplate,
            MeterRegistry meterRegistry,
            @Value("${telemetry.kafka.topics.telemetry}") String telemetryTopic,
            @Value("${telemetry.kafka.topics.device-status}") String deviceStatusTopic,
            @Value("${telemetry.kafka.topics.dlq}") String dlqTopic,
            @Value("${telemetry.ingest.plausibility.max-speed-kmh}") double maxSpeedKmh,
            @Value("${telemetry.ingest.plausibility.max-accuracy-m}") double maxAccuracyM) {
        this.deviceRepository = deviceRepository;
        this.assignmentRepository = assignmentRepository;
        this.liveStateRepository = liveStateRepository;
        this.coreServiceClient = coreServiceClient;
        this.kafkaTemplate = kafkaTemplate;
        this.meterRegistry = meterRegistry;
        this.telemetryTopic = telemetryTopic;
        this.deviceStatusTopic = deviceStatusTopic;
        this.dlqTopic = dlqTopic;
        this.maxSpeedKmh = maxSpeedKmh;
        this.maxAccuracyM = maxAccuracyM;
        this.gatewayId = resolveGatewayId();
    }

    public IngestAcceptedResponse ingestLocation(UUID deviceId, LocationIngestRequest request) {
        return ingestLocation(deviceId, request, ADAPTER_HTTPS);
    }

    public IngestAcceptedResponse ingestLocation(UUID deviceId, LocationIngestRequest request, String adapter) {
        Device device = requireDevice(deviceId);
        BusTripResolution resolution = resolveBusAndTrip(deviceId, request.getTripId());
        Instant now = Instant.now();
        UUID eventId = UUID.randomUUID();

        String dedupReason = duplicateOrOutOfOrderReason(device, request.getSequenceNo());
        if (dedupReason != null) {
            publish(dlqTopic, deviceId, new DlqRecord(
                    eventId, "location", deviceId, resolution.busId(), resolution.tripId(),
                    dedupReason, request.getDeviceTimestamp(), now, request.getPayload()));
            touchDeviceLiveness(device, null);
            recordIngestOutcome("location", adapter, "duplicate");
            return IngestAcceptedResponse.builder().eventId(eventId).status("flagged").reason(dedupReason).build();
        }

        String flagReason = plausibilityIssue(request);
        EventEnvelope envelope = new EventEnvelope(
                ENVELOPE_VERSION, eventId, "location", SCHEMA_VERSION,
                deviceId, resolution.busId(), resolution.tripId(),
                request.getDeviceTimestamp(), now, request.getSequenceNo(),
                new EventEnvelope.Source(adapter, gatewayId),
                request.getPayload());

        if (flagReason != null) {
            publish(dlqTopic, deviceId, new DlqRecord(
                    eventId, "location", deviceId, resolution.busId(), resolution.tripId(),
                    flagReason, request.getDeviceTimestamp(), now, request.getPayload()));
            touchDeviceLiveness(device, request.getSequenceNo());
            recordIngestOutcome("location", adapter, "flagged");
            return IngestAcceptedResponse.builder().eventId(eventId).status("flagged").reason(flagReason).build();
        }

        publish(telemetryTopic, deviceId, envelope);
        touchDeviceLiveness(device, request.getSequenceNo());
        recordIngestOutcome("location", adapter, "accepted");
        recordIngestLatency(request.getDeviceTimestamp(), now);

        if (resolution.busId() != null) {
            upsertLiveState(resolution.busId(), deviceId, resolution.tripId(), request, now);
        }

        return IngestAcceptedResponse.builder().eventId(eventId).status("accepted").build();
    }

    public IngestAcceptedResponse ingestDeviceStatus(UUID deviceId, DeviceStatusIngestRequest request) {
        return ingestDeviceStatus(deviceId, request, ADAPTER_HTTPS);
    }

    public IngestAcceptedResponse ingestDeviceStatus(UUID deviceId, DeviceStatusIngestRequest request, String adapter) {
        Device device = requireDevice(deviceId);
        BusTripResolution resolution = resolveBusAndTrip(deviceId, request.getTripId());
        Instant now = Instant.now();
        UUID eventId = UUID.randomUUID();

        EventEnvelope envelope = new EventEnvelope(
                ENVELOPE_VERSION, eventId, "device-status", SCHEMA_VERSION,
                deviceId, resolution.busId(), resolution.tripId(),
                request.getDeviceTimestamp(), now, null,
                new EventEnvelope.Source(adapter, gatewayId),
                request.getPayload());

        publish(deviceStatusTopic, deviceId, envelope);
        touchDeviceLiveness(device, null);
        recordIngestOutcome("device-status", adapter, "accepted");

        return IngestAcceptedResponse.builder().eventId(eventId).status("accepted").build();
    }

    private Device requireDevice(UUID deviceId) {
        return deviceRepository.findById(deviceId)
                .orElseThrow(() -> new NotFoundException("Device not found: " + deviceId));
    }

    /**
     * busId/tripId resolution: an explicit tripId hint (e.g. the conductor app's own trip context)
     * takes priority and is resolved via core-service directly — this is what lets a device with no
     * fixed installation (a phone, reassigned trip to trip) still resolve the right bus. Falling
     * back to the device's static assignment (for a hardware tracker bolted to one bus) only
     * happens when no hint is given; a hint that fails to resolve is NOT silently replaced by the
     * assignment fallback, since a wrong/stale tripId shouldn't get attached to a different bus.
     */
    private BusTripResolution resolveBusAndTrip(UUID deviceId, UUID tripIdHint) {
        if (tripIdHint != null) {
            Optional<CoreServiceClient.TripSummary> trip = coreServiceClient.getTripById(tripIdHint);
            return trip.map(t -> new BusTripResolution(t.busId(), t.id()))
                    .orElseGet(() -> new BusTripResolution(null, null));
        }

        Optional<UUID> assignedBusId = assignmentRepository.findByDeviceIdAndUnassignedAtIsNull(deviceId)
                .map(a -> a.getBusId());
        if (assignedBusId.isEmpty()) {
            return new BusTripResolution(null, null);
        }

        UUID busId = assignedBusId.get();
        UUID resolvedTripId = coreServiceClient.findActiveTripForBus(busId)
                .map(CoreServiceClient.TripSummary::id)
                .orElse(null);
        return new BusTripResolution(busId, resolvedTripId);
    }

    private String plausibilityIssue(LocationIngestRequest request) {
        var payload = request.getPayload();
        if (payload.getAccuracyM() != null && payload.getAccuracyM() > maxAccuracyM) {
            return "accuracy %.1fm exceeds max %.1fm".formatted(payload.getAccuracyM(), maxAccuracyM);
        }
        if (payload.getSpeedKmh() != null && payload.getSpeedKmh() > maxSpeedKmh) {
            return "speed %.1fkm/h exceeds plausible max %.1fkm/h".formatted(payload.getSpeedKmh(), maxSpeedKmh);
        }
        return null;
    }

    /**
     * Late-data policy (Phase 4 hardening): a fix that arrived out of order (e.g. buffered while
     * offline, or re-delivered by a flaky MQTT/cellular link) must not regress bus_live_state to an
     * older position than one already recorded. Only compares deviceTimestamp against the row's
     * current one — a bus with no live-state row yet always accepts its first fix.
     */
    private void upsertLiveState(UUID busId, UUID deviceId, UUID tripId, LocationIngestRequest request, Instant now) {
        var payload = request.getPayload();
        BusLiveState state = liveStateRepository.findById(busId).orElseGet(() -> BusLiveState.builder().busId(busId).build());

        if (state.getDeviceTimestamp() != null && request.getDeviceTimestamp() != null
                && request.getDeviceTimestamp().isBefore(state.getDeviceTimestamp())) {
            log.debug("Ignoring stale live-state update for bus {}: fix={} is older than current={}",
                    busId, request.getDeviceTimestamp(), state.getDeviceTimestamp());
            return;
        }

        state.setDeviceId(deviceId);
        state.setTripId(tripId);
        state.setLat(payload.getLat());
        state.setLng(payload.getLng());
        state.setSpeedKmh(payload.getSpeedKmh());
        state.setHeadingDeg(payload.getHeadingDeg());
        state.setDeviceTimestamp(request.getDeviceTimestamp());
        state.setIngestedAt(now);
        liveStateRepository.save(state);
    }

    /**
     * Idempotency (Phase 4 hardening): rejects a location fix whose sequenceNo is not strictly
     * greater than the last one accepted for this device — a re-delivery (MQTT QoS 1, a retried
     * HTTP POST after a dropped response) or a fix that arrived out of order. A fix with no
     * sequenceNo (the device doesn't send one) always passes — dedup is opt-in per device.
     */
    private String duplicateOrOutOfOrderReason(Device device, Long sequenceNo) {
        if (sequenceNo == null || device.getLastSequenceNo() == null) {
            return null;
        }
        if (sequenceNo <= device.getLastSequenceNo()) {
            return "duplicate or out-of-order sequenceNo %d (last accepted: %d)"
                    .formatted(sequenceNo, device.getLastSequenceNo());
        }
        return null;
    }

    private void touchDeviceLiveness(Device device, Long sequenceNo) {
        device.setLastSeenAt(Instant.now());
        if (device.getStatus() == DeviceStatus.PROVISIONED) {
            device.setStatus(DeviceStatus.ACTIVE);
        }
        if (sequenceNo != null && (device.getLastSequenceNo() == null || sequenceNo > device.getLastSequenceNo())) {
            device.setLastSequenceNo(sequenceNo);
        }
        deviceRepository.save(device);
    }

    private void publish(String topic, UUID key, Object value) {
        try {
            kafkaTemplate.send(topic, key.toString(), value).get(3, TimeUnit.SECONDS);
        } catch (Exception e) {
            throw new IngestException("Failed to publish to " + topic, e);
        }
    }

    /** Ingest outcome counter (Phase 4 observability) — feeds the Grafana IoT dashboard's ingest
     * and DLQ rate panels, broken down by event type, adapter (https/mqtt), and outcome. */
    private void recordIngestOutcome(String eventType, String adapter, String outcome) {
        Counter.builder("telemetry.ingest.events")
                .description("Count of ingest attempts by event type, adapter, and outcome")
                .tag("eventType", eventType)
                .tag("adapter", adapter)
                .tag("outcome", outcome)
                .register(meterRegistry)
                .increment();
    }

    /** End-to-end latency (deviceTimestamp -> ingestedAt) for accepted location fixes — feeds the
     * Grafana dashboard's latency panel. Skips fixes with a clearly-skewed (future) device clock
     * rather than recording a negative duration, which Micrometer's Timer rejects. */
    private void recordIngestLatency(Instant deviceTimestamp, Instant ingestedAt) {
        if (deviceTimestamp == null) return;
        long millis = java.time.Duration.between(deviceTimestamp, ingestedAt).toMillis();
        if (millis < 0) return;
        Timer.builder("telemetry.ingest.latency")
                .description("Time between a device's own fix timestamp and when it was ingested")
                // Histogram buckets (not just count/sum) so Grafana can compute p50/p95 via
                // histogram_quantile — same convention as http.server.requests in application.yml.
                .publishPercentileHistogram()
                .register(meterRegistry)
                .record(java.time.Duration.ofMillis(millis));
    }

    private static String resolveGatewayId() {
        try {
            return InetAddress.getLocalHost().getHostName();
        } catch (UnknownHostException e) {
            return "telemetry-service";
        }
    }

    private record BusTripResolution(UUID busId, UUID tripId) {
    }
}
