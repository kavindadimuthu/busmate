package com.busmatelk.telemetry.ingest;

import com.busmatelk.telemetry.AbstractPostgresIntegrationTest;
import com.busmatelk.telemetry.device.entity.CredentialType;
import com.busmatelk.telemetry.device.entity.Device;
import com.busmatelk.telemetry.device.entity.DeviceAssignment;
import com.busmatelk.telemetry.device.entity.DeviceCredential;
import com.busmatelk.telemetry.device.entity.DeviceStatus;
import com.busmatelk.telemetry.device.repository.DeviceAssignmentRepository;
import com.busmatelk.telemetry.device.repository.DeviceCredentialRepository;
import com.busmatelk.telemetry.device.repository.DeviceRepository;
import com.busmatelk.telemetry.device.service.DeviceTokens;
import com.busmatelk.telemetry.ingest.client.CoreServiceClient;
import com.busmatelk.telemetry.livestate.repository.BusLiveStateRepository;
import com.busmatelk.telemetry.vehiclestate.entity.BusActiveAlert;
import com.busmatelk.telemetry.vehiclestate.entity.BusVehicleState;
import com.busmatelk.telemetry.vehiclestate.repository.BusActiveAlertRepository;
import com.busmatelk.telemetry.vehiclestate.repository.BusVehicleStateRepository;
import com.fasterxml.jackson.databind.JsonNode;
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
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
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
 * INC-023: vehicle health reaches the pipeline on its own topic and is stored per bus, tagged with
 * the bus's operator. Runs the real Flyway migrations on real Postgres and a real (embedded) broker,
 * like the other ingest tests; core-service is the only mock.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@AutoConfigureWebMvc
@EmbeddedKafka(partitions = 1, controlledShutdown = true,
        topics = {"iot.telemetry.v1", "iot.device-status.v1", "iot.vehicle.v1", "iot.telemetry.dlq.v1"})
@TestPropertySource(properties = {
        "spring.kafka.bootstrap-servers=${spring.embedded.kafka.brokers}",
        // A test posts several events per device; the default burst of 10 is plenty.
})
@Transactional
@DisplayName("INC-023 vehicle telemetry ingest")
class VehicleIngestIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired private WebApplicationContext webApplicationContext;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private DeviceRepository deviceRepository;
    @Autowired private DeviceAssignmentRepository assignmentRepository;
    @Autowired private DeviceCredentialRepository credentialRepository;
    @Autowired private BusVehicleStateRepository vehicleStateRepository;
    @Autowired private BusActiveAlertRepository alertRepository;
    @Autowired private BusLiveStateRepository liveStateRepository;
    @Autowired private EmbeddedKafkaBroker embeddedKafkaBroker;
    @Autowired private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;
    @jakarta.persistence.PersistenceContext private jakarta.persistence.EntityManager entityManager;

    @MockitoBean private CoreServiceClient coreServiceClient;

    @Value("${telemetry.kafka.topics.telemetry}") private String telemetryTopic;
    @Value("${telemetry.kafka.topics.vehicle}") private String vehicleTopic;
    @Value("${telemetry.kafka.topics.dlq}") private String dlqTopic;

    private MockMvc mockMvc;
    private UUID deviceId;
    private UUID busId;
    private UUID operatorId;
    private String token;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).apply(springSecurity()).build();

        Device device = deviceRepository.save(Device.builder()
                .serialNumber("IT-VEHICLE-" + UUID.randomUUID())
                .deviceTypeCode("GPS_TRACKER")
                .status(DeviceStatus.PROVISIONED)
                .build());
        deviceId = device.getId();
        busId = UUID.randomUUID();
        operatorId = UUID.randomUUID();
        assignmentRepository.save(DeviceAssignment.builder().deviceId(deviceId).busId(busId).build());

        token = DeviceTokens.generate();
        credentialRepository.save(DeviceCredential.builder()
                .deviceId(deviceId)
                .credentialType(CredentialType.TOKEN_HASH)
                .secretHash(DeviceTokens.hash(token))
                .build());

        when(coreServiceClient.getOperatorIdForBus(busId)).thenReturn(Optional.of(operatorId));
    }

    // --- helpers -----------------------------------------------------------------------------

    private Map<String, Object> snapshot(double fuelPct, double coolantC) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("ignition", true);
        payload.put("odometerKm", 1200.5);
        payload.put("engine", Map.of("running", true, "rpm", 1400, "gear", 4, "coolantTempC", coolantC));
        payload.put("fuel", Map.of("levelPct", fuelPct, "levelL", fuelPct * 2));
        payload.put("tyres", List.of(Map.of("position", "FL", "pressureKpa", 790.0, "tempC", 44.0)));
        payload.put("cabin", Map.of("doorsOpen", false, "passengers", 22));
        return payload;
    }

    private ResultActions send(String path, Instant deviceTimestamp, Map<String, Object> payload) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("deviceTimestamp", deviceTimestamp.toString());
        body.put("payload", payload);
        return mockMvc.perform(post("/ingest/v1/" + path)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)));
    }

    /** Same as {@link #send} but also names a trip, as a phone reporting position would. */
    private ResultActions sendNamingTrip(String path, UUID tripId, Map<String, Object> payload) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("deviceTimestamp", Instant.now().toString());
        body.put("tripId", tripId.toString());
        body.put("payload", payload);
        return mockMvc.perform(post("/ingest/v1/" + path)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)));
    }

    private Map<String, Object> alert(String code, String state, String component) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("code", code);
        payload.put("state", state);
        payload.put("severity", "warning");
        if (component != null) payload.put("component", component);
        return payload;
    }

    /**
     * What Postgres actually holds, read with SQL. Not via the entity's Map: Hibernate deep-copies
     * JSON columns with its own mapper, which on this test classpath (spring-kafka-test) picks up
     * the Scala module and returns Scala maps. Production has no Scala module; the assertion should
     * be about the stored data either way.
     */
    private double storedFuelPct() {
        entityManager.flush();
        return jdbcTemplate.queryForObject(
                "SELECT (snapshot->'fuel'->>'levelPct')::float8 FROM bus_vehicle_state WHERE bus_id = ?",
                Double.class, busId);
    }

    private Consumer<String, String> consumerFor(String... topics) {
        Map<String, Object> props = KafkaTestUtils.consumerProps("test-group-" + UUID.randomUUID(), "true", embeddedKafkaBroker);
        props.put("key.deserializer", StringDeserializer.class);
        props.put("value.deserializer", StringDeserializer.class);
        var consumer = new org.apache.kafka.clients.consumer.KafkaConsumer<String, String>(props);
        embeddedKafkaBroker.consumeFromEmbeddedTopics(consumer, topics);
        return consumer;
    }

    /** Records on a topic keyed to this test's own device — the broker is shared across the class. */
    private List<ConsumerRecord<String, String>> recordsOn(Consumer<String, String> consumer, String topic) {
        var records = KafkaTestUtils.getRecords(consumer, java.time.Duration.ofSeconds(5));
        List<ConsumerRecord<String, String>> out = new ArrayList<>();
        records.records(topic).forEach(out::add);
        return out.stream().filter(r -> deviceId.toString().equals(r.key())).toList();
    }

    // --- tests -------------------------------------------------------------------------------

    @Test
    @DisplayName("INC-023: a snapshot is published to the vehicle topic and never to the position topic")
    void snapshotUsesItsOwnTopic() throws Exception {
        send("vehicle-telemetry", Instant.now(), snapshot(60, 88)).andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status").value("accepted"));

        try (var consumer = consumerFor(telemetryTopic, vehicleTopic)) {
            var vehicle = recordsOn(consumer, vehicleTopic);
            assertThat(vehicle).hasSize(1);
            JsonNode envelope = objectMapper.readTree(vehicle.get(0).value());
            assertThat(envelope.get("eventType").asText()).isEqualTo("vehicle-telemetry");
            assertThat(envelope.get("busId").asText()).isEqualTo(busId.toString());
            assertThat(envelope.get("payload").get("fuel").get("levelPct").asDouble()).isEqualTo(60);
        }
        try (var consumer = consumerFor(telemetryTopic)) {
            assertThat(recordsOn(consumer, telemetryTopic)).isEmpty();
        }
        assertThat(liveStateRepository.findById(busId)).isEmpty();
    }

    @Test
    @DisplayName("INC-023: the latest snapshot per bus is stored with the bus's operator")
    void snapshotStoredWithOperator() throws Exception {
        Instant t = Instant.now();
        send("vehicle-telemetry", t, snapshot(60, 88)).andExpect(status().isAccepted());
        send("vehicle-telemetry", t.plusSeconds(5), snapshot(58, 90)).andExpect(status().isAccepted());

        assertThat(vehicleStateRepository.findAll().stream().filter(s -> s.getBusId().equals(busId))).hasSize(1);
        BusVehicleState state = vehicleStateRepository.findById(busId).orElseThrow();
        assertThat(state.getOperatorId()).isEqualTo(operatorId);
        assertThat(state.getDeviceId()).isEqualTo(deviceId);
        assertThat(storedFuelPct()).isEqualTo(58);
    }

    @Test
    @DisplayName("INC-023: an older snapshot never overwrites a newer one")
    void staleSnapshotIgnored() throws Exception {
        Instant t = Instant.now();
        send("vehicle-telemetry", t, snapshot(50, 88)).andExpect(status().isAccepted());
        send("vehicle-telemetry", t.minusSeconds(60), snapshot(90, 88)).andExpect(status().isAccepted());

        assertThat(storedFuelPct()).isEqualTo(50);
    }

    @Test
    @DisplayName("INC-023: a bus whose operator cannot be resolved is still accepted and stored, untagged")
    void unresolvedOperatorStoredUntagged() throws Exception {
        when(coreServiceClient.getOperatorIdForBus(busId)).thenReturn(Optional.empty());

        send("vehicle-telemetry", Instant.now(), snapshot(60, 88)).andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status").value("accepted"));

        BusVehicleState state = vehicleStateRepository.findById(busId).orElseThrow();
        assertThat(state.getOperatorId()).isNull();
    }

    @Test
    @DisplayName("INC-023: an implausible reading goes to the dead-letter topic and never touches stored state")
    void implausibleReadingFlagged() throws Exception {
        send("vehicle-telemetry", Instant.now(), snapshot(60, 900)).andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status").value("flagged"))
                .andExpect(jsonPath("$.reason").value(org.hamcrest.Matchers.containsString("coolant")));

        // One consumer per topic: a poll drains every subscribed topic, so sharing one would leave
        // the second assertion with nothing to read.
        try (var dlqConsumer = consumerFor(dlqTopic)) {
            var dlq = recordsOn(dlqConsumer, dlqTopic);
            assertThat(dlq).hasSize(1);
            assertThat(objectMapper.readTree(dlq.get(0).value()).get("eventType").asText()).isEqualTo("vehicle-telemetry");
        }
        try (var vehicleConsumer = consumerFor(vehicleTopic)) {
            assertThat(recordsOn(vehicleConsumer, vehicleTopic)).isEmpty();
        }
        assertThat(vehicleStateRepository.findById(busId)).isEmpty();
    }

    @Test
    @DisplayName("INC-023: a structurally invalid snapshot is refused and publishes nothing")
    void invalidSnapshotRefused() throws Exception {
        send("vehicle-telemetry", Instant.now(), snapshot(140, 88)).andExpect(status().isBadRequest());

        try (var consumer = consumerFor(vehicleTopic, dlqTopic)) {
            assertThat(recordsOn(consumer, vehicleTopic)).isEmpty();
        }
        assertThat(vehicleStateRepository.findById(busId)).isEmpty();
    }

    @Test
    @DisplayName("INC-023: fields the contract does not declare are never stored or forwarded")
    void undeclaredFieldsDropped() throws Exception {
        Map<String, Object> payload = snapshot(60, 88);
        payload.put("driverName", "A. Perera");
        payload.put("cabin", Map.of("passengers", 22, "passengerNames", List.of("X")));

        send("vehicle-telemetry", Instant.now(), payload).andExpect(status().isAccepted());

        String stored = objectMapper.writeValueAsString(vehicleStateRepository.findById(busId).orElseThrow().getSnapshot());
        assertThat(stored).doesNotContain("driverName").doesNotContain("passengerNames").doesNotContain("Perera");
        try (var consumer = consumerFor(vehicleTopic)) {
            var vehicle = recordsOn(consumer, vehicleTopic);
            assertThat(vehicle).hasSize(1);
            assertThat(vehicle.get(0).value()).doesNotContain("driverName").doesNotContain("passengerNames");
        }
    }

    @Test
    @DisplayName("INC-023: an alert stays raised until the device clears it, and a snapshot does not clear it")
    void alertClearedOnlyByDevice() throws Exception {
        Instant t = Instant.now();
        send("alert", t, alert("TYRE_PRESSURE_LOW", "raised", "RRO")).andExpect(status().isAccepted());
        assertThat(alertRepository.findByBusId(busId)).hasSize(1);
        BusActiveAlert stored = alertRepository.findByBusId(busId).get(0);
        assertThat(stored.getOperatorId()).isEqualTo(operatorId);
        assertThat(stored.getComponent()).isEqualTo("RRO");

        // A later snapshot that no longer looks bad does not clear it: the device owns the alert.
        send("vehicle-telemetry", t.plusSeconds(10), snapshot(60, 88)).andExpect(status().isAccepted());
        assertThat(alertRepository.findByBusId(busId)).hasSize(1);

        // Clearing a different component leaves it alone.
        send("alert", t.plusSeconds(20), alert("TYRE_PRESSURE_LOW", "cleared", "FL")).andExpect(status().isAccepted());
        assertThat(alertRepository.findByBusId(busId)).hasSize(1);

        send("alert", t.plusSeconds(30), alert("TYRE_PRESSURE_LOW", "cleared", "RRO")).andExpect(status().isAccepted());
        assertThat(alertRepository.findByBusId(busId)).isEmpty();
    }

    @Test
    @DisplayName("INC-023: a repeated raise keeps the original raise time, and a stale clear cannot remove a newer raise")
    void alertOrdering() throws Exception {
        Instant t = Instant.now();
        send("alert", t, alert("LOW_FUEL", "raised", null)).andExpect(status().isAccepted());
        send("alert", t.plusSeconds(60), alert("LOW_FUEL", "raised", null)).andExpect(status().isAccepted());

        List<BusActiveAlert> active = alertRepository.findByBusId(busId);
        assertThat(active).hasSize(1);
        assertThat(active.get(0).getRaisedAt()).isEqualTo(t);
        assertThat(active.get(0).getComponent()).isEmpty();

        send("alert", t.plusSeconds(30), alert("LOW_FUEL", "cleared", null)).andExpect(status().isAccepted());
        assertThat(alertRepository.findByBusId(busId)).hasSize(1);

        send("alert", t.plusSeconds(90), alert("LOW_FUEL", "cleared", null)).andExpect(status().isAccepted());
        assertThat(alertRepository.findByBusId(busId)).isEmpty();
    }

    @Test
    @DisplayName("INC-023: alerts are published to the vehicle topic")
    void alertUsesVehicleTopic() throws Exception {
        send("alert", Instant.now(), alert("ENGINE_OVERHEAT", "raised", null)).andExpect(status().isAccepted());

        try (var consumer = consumerFor(vehicleTopic)) {
            var records = recordsOn(consumer, vehicleTopic);
            assertThat(records).hasSize(1);
            JsonNode envelope = objectMapper.readTree(records.get(0).value());
            assertThat(envelope.get("eventType").asText()).isEqualTo("alert");
            assertThat(envelope.get("payload").get("code").asText()).isEqualTo("ENGINE_OVERHEAT");
        }
    }

    @Test
    @DisplayName("INC-023: an alert with a free-text code or unknown state is refused")
    void invalidAlertRefused() throws Exception {
        send("alert", Instant.now(), alert("low fuel", "raised", null)).andExpect(status().isBadRequest());
        send("alert", Instant.now(), alert("LOW_FUEL", "resolved", null)).andExpect(status().isBadRequest());
        assertThat(alertRepository.findByBusId(busId)).isEmpty();
    }

    @Test
    @DisplayName("INC-023: a device with no bus assignment is accepted and published but nothing is stored")
    void unassignedDeviceNotStored() throws Exception {
        assignmentRepository.deleteAll(assignmentRepository.findAll().stream().filter(a -> a.getDeviceId().equals(deviceId)).toList());

        send("vehicle-telemetry", Instant.now(), snapshot(60, 88)).andExpect(status().isAccepted());
        send("alert", Instant.now(), alert("LOW_FUEL", "raised", null)).andExpect(status().isAccepted());

        assertThat(vehicleStateRepository.findById(busId)).isEmpty();
        assertThat(alertRepository.findByBusId(busId)).isEmpty();
    }

    @Test
    @DisplayName("INC-023: naming another operator's trip cannot file vehicle health or alerts against their bus")
    void tripHintCannotRedirectVehicleEvents() throws Exception {
        // A device with no installed bus (a phone) names the trip of a rival operator's bus.
        assignmentRepository.deleteAll(assignmentRepository.findAll().stream().filter(a -> a.getDeviceId().equals(deviceId)).toList());
        UUID rivalTrip = UUID.randomUUID();
        UUID rivalBus = UUID.randomUUID();
        when(coreServiceClient.getTripById(rivalTrip)).thenReturn(Optional.of(
                new CoreServiceClient.TripSummary(rivalTrip, rivalBus, java.time.LocalDate.now(), "in_transit")));
        when(coreServiceClient.getOperatorIdForBus(rivalBus)).thenReturn(Optional.of(UUID.randomUUID()));

        sendNamingTrip("vehicle-telemetry", rivalTrip, snapshot(60, 88)).andExpect(status().isAccepted());
        sendNamingTrip("alert", rivalTrip, alert("ENGINE_OVERHEAT", "raised", null)).andExpect(status().isAccepted());

        assertThat(vehicleStateRepository.findById(rivalBus)).isEmpty();
        assertThat(alertRepository.findByBusId(rivalBus)).isEmpty();
        org.mockito.Mockito.verify(coreServiceClient, org.mockito.Mockito.never()).getTripById(rivalTrip);
        try (var consumer = consumerFor(vehicleTopic)) {
            for (var record : recordsOn(consumer, vehicleTopic)) {
                assertThat(objectMapper.readTree(record.value()).get("busId").isNull()).as("published with no bus").isTrue();
            }
        }
    }

    @Test
    @DisplayName("INC-023: an installed device's vehicle events go to its own bus whatever trip it names")
    void installedDeviceIgnoresTripHint() throws Exception {
        UUID otherTrip = UUID.randomUUID();
        UUID otherBus = UUID.randomUUID();
        when(coreServiceClient.getTripById(otherTrip)).thenReturn(Optional.of(
                new CoreServiceClient.TripSummary(otherTrip, otherBus, java.time.LocalDate.now(), "in_transit")));

        sendNamingTrip("vehicle-telemetry", otherTrip, snapshot(60, 88)).andExpect(status().isAccepted());
        sendNamingTrip("alert", otherTrip, alert("LOW_FUEL", "raised", null)).andExpect(status().isAccepted());

        assertThat(vehicleStateRepository.findById(busId)).isPresent();
        assertThat(alertRepository.findByBusId(busId)).hasSize(1);
        assertThat(vehicleStateRepository.findById(otherBus)).isEmpty();
        assertThat(alertRepository.findByBusId(otherBus)).isEmpty();
    }

    @Test
    @DisplayName("INC-023: the vehicle endpoints need a valid device token")
    void requiresDeviceToken() throws Exception {
        // Refused the same way location ingest refuses a missing or unknown token (403).
        mockMvc.perform(post("/ingest/v1/vehicle-telemetry").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/ingest/v1/alert").header("Authorization", "Bearer bmt_not_a_real_token")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
        assertThat(vehicleStateRepository.findById(busId)).isEmpty();
    }
}
