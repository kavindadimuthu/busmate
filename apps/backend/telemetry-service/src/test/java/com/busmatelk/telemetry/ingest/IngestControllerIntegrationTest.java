package com.busmatelk.telemetry.ingest;

import com.busmatelk.telemetry.AbstractPostgresIntegrationTest;
import com.busmatelk.telemetry.device.entity.CredentialType;
import com.busmatelk.telemetry.device.entity.Device;
import com.busmatelk.telemetry.device.entity.DeviceCredential;
import com.busmatelk.telemetry.device.entity.DeviceStatus;
import com.busmatelk.telemetry.device.repository.DeviceCredentialRepository;
import com.busmatelk.telemetry.device.repository.DeviceRepository;
import com.busmatelk.telemetry.device.service.DeviceTokens;
import com.busmatelk.telemetry.ingest.client.CoreServiceClient;
import com.busmatelk.telemetry.livestate.repository.BusLiveStateRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.clients.consumer.Consumer;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.kafka.test.EmbeddedKafkaBroker;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.kafka.test.utils.KafkaTestUtils;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Exercises the HTTPS ingest pipeline end to end (IoT Platform Layer plan, Phase 2): device-token
 * auth, tripId-hint enrichment (via a mocked CoreServiceClient — no real core-service in this
 * suite), Kafka publish (verified by actually consuming the embedded broker's topics), DLQ routing
 * for implausible-but-valid data, and the per-device rate limiter.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@AutoConfigureWebMvc
@EmbeddedKafka(partitions = 1, controlledShutdown = true,
        topics = {"iot.telemetry.v1", "iot.device-status.v1", "iot.telemetry.dlq.v1"})
@TestPropertySource(properties = {
        "spring.kafka.bootstrap-servers=${spring.embedded.kafka.brokers}",
        // Tight budget so the rate-limit test doesn't need dozens of requests.
        "telemetry.ingest.rate-limit.capacity=2",
        "telemetry.ingest.rate-limit.refill-per-second=0.001",
})
@Transactional
@DisplayName("Ingest Controller Integration Tests")
// Deliberately no @DirtiesContext: @Transactional already rolls back every DB write per test, and
// @MockitoBean resets its mock between tests automatically — recreating the whole context (and,
// worse, restarting the embedded Kafka broker) for every one of these tests cost ~400s for 7 tests
// before this was removed. Each test still gets an isolated device (a fresh random UUID in
// @BeforeEach), so nothing leaks between them regardless of context reuse.
class IngestControllerIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private DeviceCredentialRepository credentialRepository;

    @Autowired
    private BusLiveStateRepository liveStateRepository;

    @Autowired
    private EmbeddedKafkaBroker embeddedKafkaBroker;

    @MockitoBean
    private CoreServiceClient coreServiceClient;

    @Value("${telemetry.kafka.topics.telemetry}")
    private String telemetryTopic;

    @Value("${telemetry.kafka.topics.dlq}")
    private String dlqTopic;

    private MockMvc mockMvc;
    private UUID deviceId;
    private String token;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();

        Device device = deviceRepository.save(Device.builder()
                .serialNumber("IT-INGEST-" + UUID.randomUUID())
                .deviceTypeCode("GPS_TRACKER")
                .status(DeviceStatus.PROVISIONED)
                .build());
        deviceId = device.getId();

        token = DeviceTokens.generate();
        credentialRepository.save(DeviceCredential.builder()
                .deviceId(deviceId)
                .credentialType(CredentialType.TOKEN_HASH)
                .secretHash(DeviceTokens.hash(token))
                .build());
    }

    private String locationBody(Double lat, Double lng, Double speedKmh, UUID tripId) throws Exception {
        var payload = new java.util.HashMap<String, Object>();
        payload.put("lat", lat);
        payload.put("lng", lng);
        if (speedKmh != null) payload.put("speedKmh", speedKmh);

        var body = new java.util.HashMap<String, Object>();
        body.put("deviceTimestamp", Instant.now().toString());
        body.put("payload", payload);
        if (tripId != null) body.put("tripId", tripId.toString());
        return objectMapper.writeValueAsString(body);
    }

    private Consumer<String, String> newConsumer(String... topics) {
        Map<String, Object> props = KafkaTestUtils.consumerProps("test-group-" + UUID.randomUUID(), "true", embeddedKafkaBroker);
        props.put("key.deserializer", StringDeserializer.class);
        props.put("value.deserializer", StringDeserializer.class);
        var consumer = new org.apache.kafka.clients.consumer.KafkaConsumer<String, String>(props);
        embeddedKafkaBroker.consumeFromEmbeddedTopics(consumer, topics);
        return consumer;
    }

    /**
     * Reads every record currently on the topic (from the beginning — this class has no
     * @DirtiesContext, so the embedded broker and its topics are shared across all tests in this
     * class) and returns only the ones keyed to this test's own device. Asserting against the
     * whole topic instead would be flaky depending on test execution order.
     */
    private List<ConsumerRecord<String, String>> recordsForThisDevice(Consumer<String, String> consumer, String topic) {
        var records = KafkaTestUtils.getRecords(consumer, java.time.Duration.ofSeconds(5));
        List<ConsumerRecord<String, String>> forTopic = new java.util.ArrayList<>();
        records.records(topic).forEach(forTopic::add);
        return forTopic.stream().filter(r -> deviceId.toString().equals(r.key())).toList();
    }

    @Test
    @DisplayName("accepts a location fix with no bus context, flips device to ACTIVE, sets lastSeenAt")
    void acceptsLocationWithNoContext() throws Exception {
        try (var consumer = newConsumer(telemetryTopic)) {
            mockMvc.perform(post("/ingest/v1/location")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(locationBody(6.9271, 79.8612, 40.0, null)))
                    .andExpect(status().isAccepted())
                    .andExpect(jsonPath("$.status").value("accepted"))
                    .andExpect(jsonPath("$.eventId").isNotEmpty());

            List<ConsumerRecord<String, String>> records = recordsForThisDevice(consumer, telemetryTopic);
            assertThat(records).hasSize(1);
            assertThat(records.get(0).value()).contains("\"eventType\":\"location\"").contains("\"busId\":null");
        }

        Device updated = deviceRepository.findById(deviceId).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(DeviceStatus.ACTIVE);
        assertThat(updated.getLastSeenAt()).isNotNull();
    }

    @Test
    @DisplayName("resolves bus from a tripId hint and upserts live-state")
    void resolvesBusFromTripHintAndUpsertsLiveState() throws Exception {
        UUID tripId = UUID.randomUUID();
        UUID busId = UUID.randomUUID();
        when(coreServiceClient.getTripById(tripId))
                .thenReturn(Optional.of(new CoreServiceClient.TripSummary(tripId, busId, LocalDate.now(), "active")));

        try (var consumer = newConsumer(telemetryTopic)) {
            mockMvc.perform(post("/ingest/v1/location")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(locationBody(6.9271, 79.8612, 40.0, tripId)))
                    .andExpect(status().isAccepted())
                    .andExpect(jsonPath("$.status").value("accepted"));

            List<ConsumerRecord<String, String>> records = recordsForThisDevice(consumer, telemetryTopic);
            assertThat(records).hasSize(1);
            assertThat(records.get(0).value()).contains("\"busId\":\"" + busId + "\"").contains("\"tripId\":\"" + tripId + "\"");
        }

        var liveState = liveStateRepository.findById(busId).orElseThrow();
        assertThat(liveState.getDeviceId()).isEqualTo(deviceId);
        assertThat(liveState.getTripId()).isEqualTo(tripId);
        assertThat(liveState.getLat()).isEqualTo(6.9271);
    }

    @Test
    @DisplayName("routes an implausible speed to the DLQ instead of the main topic")
    void routesImplausibleSpeedToDlq() throws Exception {
        try (var main = newConsumer(telemetryTopic); var dlq = newConsumer(dlqTopic)) {
            mockMvc.perform(post("/ingest/v1/location")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(locationBody(6.9271, 79.8612, 999.0, null)))
                    .andExpect(status().isAccepted())
                    .andExpect(jsonPath("$.status").value("flagged"))
                    .andExpect(jsonPath("$.reason").exists());

            List<ConsumerRecord<String, String>> dlqRecords = recordsForThisDevice(dlq, dlqTopic);
            assertThat(dlqRecords).hasSize(1);
            assertThat(dlqRecords.get(0).value()).contains("exceeds plausible max");

            assertThat(recordsForThisDevice(main, telemetryTopic)).isEmpty();
        }
    }

    @Test
    @DisplayName("rejects a malformed payload before it reaches Kafka")
    void rejectsMalformedPayload() throws Exception {
        mockMvc.perform(post("/ingest/v1/location")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(locationBody(200.0, 79.8612, 40.0, null)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("rejects an unknown device token")
    void rejectsUnknownToken() throws Exception {
        mockMvc.perform(post("/ingest/v1/location")
                        .header("Authorization", "Bearer bmt_not_a_real_token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(locationBody(6.9271, 79.8612, 40.0, null)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("rejects tokens from a disabled device")
    void rejectsDisabledDevice() throws Exception {
        Device device = deviceRepository.findById(deviceId).orElseThrow();
        device.setStatus(DeviceStatus.DISABLED);
        deviceRepository.save(device);

        mockMvc.perform(post("/ingest/v1/location")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(locationBody(6.9271, 79.8612, 40.0, null)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("enforces the per-device rate limit")
    void enforcesRateLimit() throws Exception {
        String body = locationBody(6.9271, 79.8612, 40.0, null);

        // Budget is 2 (test property override) with a near-zero refill rate.
        mockMvc.perform(post("/ingest/v1/location")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isAccepted());
        mockMvc.perform(post("/ingest/v1/location")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isAccepted());
        mockMvc.perform(post("/ingest/v1/location")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().is(429));
    }
}
