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
    private static final String ADAPTER = "https";

    private final DeviceRepository deviceRepository;
    private final DeviceAssignmentRepository assignmentRepository;
    private final BusLiveStateRepository liveStateRepository;
    private final CoreServiceClient coreServiceClient;
    private final KafkaTemplate<String, Object> kafkaTemplate;

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
        this.telemetryTopic = telemetryTopic;
        this.deviceStatusTopic = deviceStatusTopic;
        this.dlqTopic = dlqTopic;
        this.maxSpeedKmh = maxSpeedKmh;
        this.maxAccuracyM = maxAccuracyM;
        this.gatewayId = resolveGatewayId();
    }

    public IngestAcceptedResponse ingestLocation(UUID deviceId, LocationIngestRequest request) {
        Device device = requireDevice(deviceId);
        BusTripResolution resolution = resolveBusAndTrip(deviceId, request.getTripId());
        Instant now = Instant.now();
        UUID eventId = UUID.randomUUID();

        String flagReason = plausibilityIssue(request);
        EventEnvelope envelope = new EventEnvelope(
                ENVELOPE_VERSION, eventId, "location", SCHEMA_VERSION,
                deviceId, resolution.busId(), resolution.tripId(),
                request.getDeviceTimestamp(), now, request.getSequenceNo(),
                new EventEnvelope.Source(ADAPTER, gatewayId),
                request.getPayload());

        if (flagReason != null) {
            publish(dlqTopic, deviceId, new DlqRecord(
                    eventId, "location", deviceId, resolution.busId(), resolution.tripId(),
                    flagReason, request.getDeviceTimestamp(), now, request.getPayload()));
            touchDeviceLiveness(device);
            return IngestAcceptedResponse.builder().eventId(eventId).status("flagged").reason(flagReason).build();
        }

        publish(telemetryTopic, deviceId, envelope);
        touchDeviceLiveness(device);

        if (resolution.busId() != null) {
            upsertLiveState(resolution.busId(), deviceId, resolution.tripId(), request, now);
        }

        return IngestAcceptedResponse.builder().eventId(eventId).status("accepted").build();
    }

    public IngestAcceptedResponse ingestDeviceStatus(UUID deviceId, DeviceStatusIngestRequest request) {
        Device device = requireDevice(deviceId);
        BusTripResolution resolution = resolveBusAndTrip(deviceId, request.getTripId());
        Instant now = Instant.now();
        UUID eventId = UUID.randomUUID();

        EventEnvelope envelope = new EventEnvelope(
                ENVELOPE_VERSION, eventId, "device-status", SCHEMA_VERSION,
                deviceId, resolution.busId(), resolution.tripId(),
                request.getDeviceTimestamp(), now, null,
                new EventEnvelope.Source(ADAPTER, gatewayId),
                request.getPayload());

        publish(deviceStatusTopic, deviceId, envelope);
        touchDeviceLiveness(device);

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

    private void upsertLiveState(UUID busId, UUID deviceId, UUID tripId, LocationIngestRequest request, Instant now) {
        var payload = request.getPayload();
        BusLiveState state = liveStateRepository.findById(busId).orElseGet(() -> BusLiveState.builder().busId(busId).build());
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

    private void touchDeviceLiveness(Device device) {
        device.setLastSeenAt(Instant.now());
        if (device.getStatus() == DeviceStatus.PROVISIONED) {
            device.setStatus(DeviceStatus.ACTIVE);
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
