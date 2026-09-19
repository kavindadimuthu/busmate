package com.busmatelk.telemetry.vehiclestate;

import com.busmatelk.telemetry.AbstractPostgresIntegrationTest;
import com.busmatelk.telemetry.device.entity.Device;
import com.busmatelk.telemetry.device.entity.DeviceAssignment;
import com.busmatelk.telemetry.device.entity.DeviceStatus;
import com.busmatelk.telemetry.device.repository.DeviceAssignmentRepository;
import com.busmatelk.telemetry.device.repository.DeviceRepository;
import com.busmatelk.telemetry.ingest.IngestService;
import com.busmatelk.telemetry.ingest.client.CoreServiceClient;
import com.busmatelk.telemetry.ingest.dto.VehicleTelemetryIngestRequest;
import com.busmatelk.telemetry.ingest.dto.VehicleTelemetryPayload;
import com.busmatelk.telemetry.tenancy.TenantContext;
import com.busmatelk.telemetry.vehiclestate.service.VehicleStateService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.IllegalTransactionStateException;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.context.WebApplicationContext;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

/**
 * INC-024: one operator's vehicle data is invisible to another operator because the database refuses
 * it — the cross-tenant isolation suite ADR-005 requires. Runs against real Postgres with the real
 * policies, connecting as the restricted runtime role exactly as production does.
 *
 * <p>Deliberately not {@code @Transactional}. A class-wide test transaction shares one Hibernate
 * session, whose first-level cache would answer reads without ever asking the database — hiding
 * precisely what is being tested. Here data is committed, every request is its own transaction on a
 * pooled connection as in production, and the owner role cleans up afterwards.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@AutoConfigureWebMvc
@EmbeddedKafka(partitions = 1, controlledShutdown = true,
        topics = {"iot.telemetry.v1", "iot.device-status.v1", "iot.vehicle.v1", "iot.telemetry.dlq.v1"})
@TestPropertySource(properties = "spring.kafka.bootstrap-servers=${spring.embedded.kafka.brokers}")
@DisplayName("INC-024 operator isolation")
class OperatorIsolationIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired private WebApplicationContext webApplicationContext;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private VehicleStateService vehicleStateService;
    @Autowired private TenantContext tenantContext;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private PlatformTransactionManager transactionManager;
    @Autowired private DeviceRepository deviceRepository;
    @Autowired private DeviceAssignmentRepository assignmentRepository;
    @Autowired private IngestService ingestService;

    @MockitoBean private CoreServiceClient coreServiceClient;

    private final UUID operatorA = UUID.randomUUID();
    private final UUID operatorB = UUID.randomUUID();
    private final UUID userA = UUID.randomUUID();
    private final UUID userB = UUID.randomUUID();
    private final UUID busA1 = UUID.randomUUID();
    private final UUID busA2 = UUID.randomUUID();
    private final UUID busB1 = UUID.randomUUID();
    private final UUID busUntagged = UUID.randomUUID();

    private MockMvc mockMvc;
    private TransactionTemplate tx;

    @BeforeEach
    void seed() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).apply(springSecurity()).build();
        tx = new TransactionTemplate(transactionManager);
        when(coreServiceClient.getOperatorIdForUser(userA)).thenReturn(Optional.of(operatorA));
        when(coreServiceClient.getOperatorIdForUser(userB)).thenReturn(Optional.of(operatorB));

        Instant t = Instant.now();
        UUID device = UUID.randomUUID();
        JsonNode snapshot = objectMapper.readTree("{\"ignition\":true,\"fuel\":{\"levelPct\":60}}");
        vehicleStateService.applySnapshot(busA1, device, null, operatorA, snapshot, t, t);
        vehicleStateService.applySnapshot(busA2, device, null, operatorA, snapshot, t, t);
        vehicleStateService.applySnapshot(busB1, device, null, operatorB, snapshot, t, t);
        vehicleStateService.applySnapshot(busUntagged, device, null, null, snapshot, t, t);
        vehicleStateService.raiseAlert(busA1, device, operatorA, "TYRE_PRESSURE_LOW", "FL", "warning", "Tyre FL under-inflated", t);
        vehicleStateService.raiseAlert(busB1, device, operatorB, "LOW_FUEL", null, "warning", "Fuel low", t);
    }

    @AfterEach
    void cleanUp() throws SQLException {
        // As the owner: the runtime role, correctly, cannot delete outside an ingest context.
        try (Connection owner = ownerConnection(); Statement s = owner.createStatement()) {
            s.execute("DELETE FROM bus_active_alert");
            s.execute("DELETE FROM bus_vehicle_state");
            s.execute("DELETE FROM device_assignment WHERE bus_id IN ('" + busA1 + "','" + busB1 + "')");
            s.execute("DELETE FROM device WHERE serial_number LIKE 'IT-ISO-%'");
        }
    }

    // --- helpers -----------------------------------------------------------------------------

    private MockHttpServletRequestBuilder as(String path, String userId, String userType) {
        MockHttpServletRequestBuilder request = get(path);
        if (userId != null) request.header("x-user-id", userId);
        if (userType != null) request.header("x-user-type", userType);
        return request;
    }

    private JsonNode json(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    private Set<String> busIds(JsonNode list) {
        return StreamSupport.stream(list.spliterator(), false).map(n -> n.get("busId").asText()).collect(Collectors.toSet());
    }

    private Set<String> ids(UUID... ids) {
        return java.util.Arrays.stream(ids).map(UUID::toString).collect(Collectors.toSet());
    }

    private long countAsOperator(UUID operator, String table) {
        Long count = tx.execute(status -> {
            tenantContext.asOperator(operator);
            return count(table);
        });
        return count;
    }

    private long countAsStaff(String table) {
        Long count = tx.execute(status -> {
            tenantContext.asStaff();
            return count(table);
        });
        return count;
    }

    private int updateAsOperator(UUID operator, String sql, Object... args) {
        Integer updated = tx.execute(status -> {
            tenantContext.asOperator(operator);
            return jdbc.update(sql, args);
        });
        return updated;
    }

    private long count(String table) {
        return jdbc.queryForObject("select count(*) from " + table, Long.class);
    }

    // --- the read path, as each kind of caller -----------------------------------------------

    @Test
    @DisplayName("INC-024: an operator lists only their own buses, and only their own alerts")
    void operatorListsOnlyOwnBuses() throws Exception {
        JsonNode list = json(mockMvc.perform(as("/api/vehicles/state", userA.toString(), "operator")).andReturn());
        assertThat(busIds(list)).isEqualTo(ids(busA1, busA2));
        assertThat(list.toString()).doesNotContain("LOW_FUEL");
        JsonNode a1 = StreamSupport.stream(list.spliterator(), false).filter(n -> n.get("busId").asText().equals(busA1.toString())).findFirst().orElseThrow();
        assertThat(a1.get("activeAlerts")).hasSize(1);
        assertThat(a1.get("activeAlerts").get(0).get("component").asText()).isEqualTo("FL");

        JsonNode listB = json(mockMvc.perform(as("/api/vehicles/state", userB.toString(), "operator")).andReturn());
        assertThat(busIds(listB)).isEqualTo(ids(busB1));
    }

    @Test
    @DisplayName("INC-024: another operator's bus is indistinguishable from a bus that does not exist")
    void otherOperatorsBusLooksMissing() throws Exception {
        var otherOperators = mockMvc.perform(as("/api/vehicles/" + busB1 + "/state", userA.toString(), "operator")).andReturn().getResponse();
        var missing = mockMvc.perform(as("/api/vehicles/" + UUID.randomUUID() + "/state", userA.toString(), "operator")).andReturn().getResponse();
        var untagged = mockMvc.perform(as("/api/vehicles/" + busUntagged + "/state", userA.toString(), "operator")).andReturn().getResponse();

        for (var response : List.of(otherOperators, missing, untagged)) {
            assertThat(response.getStatus()).isEqualTo(404);
            assertThat(objectMapper.readTree(response.getContentAsString()).at("/error/code").asText()).isEqualTo("NOT_FOUND");
        }
        mockMvc.perform(as("/api/vehicles/" + busA1 + "/state", userA.toString(), "operator"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk());
    }

    @Test
    @DisplayName("INC-024: no way of shaping the request widens an operator's view")
    void requestShapeCannotWidenScope() throws Exception {
        // Filters, ids and casing the caller controls are all ignored: scope comes from the database.
        var response = mockMvc.perform(as("/api/vehicles/state", userB.toString(), "OPERATOR")
                        .param("operatorId", operatorA.toString()).param("busId", busA1.toString()).param("all", "true")
                        .header("x-operator-id", operatorA.toString()))
                .andReturn();
        assertThat(busIds(json(response))).isEqualTo(ids(busB1));
        assertThat(mockMvc.perform(as("/api/vehicles/" + busA1 + "/state", userB.toString(), "operator")
                .param("operatorId", operatorA.toString())).andReturn().getResponse().getStatus()).isEqualTo(404);
    }

    @Test
    @DisplayName("INC-024: MOT and admin read every operator's buses, including ones with no known operator")
    void staffReadEverything() throws Exception {
        for (String type : List.of("mot", "admin")) {
            JsonNode list = json(mockMvc.perform(as("/api/vehicles/state", UUID.randomUUID().toString(), type)).andReturn());
            assertThat(busIds(list)).isEqualTo(ids(busA1, busA2, busB1, busUntagged));
            assertThat(mockMvc.perform(as("/api/vehicles/" + busB1 + "/state", UUID.randomUUID().toString(), type))
                    .andReturn().getResponse().getStatus()).isEqualTo(200);
        }
    }

    @Test
    @DisplayName("INC-024: passengers, conductors and unknown callers are refused outright")
    void otherCallersRefused() throws Exception {
        String someone = UUID.randomUUID().toString();
        for (String type : List.of("passenger", "conductor", "timekeeper", "nonsense")) {
            assertThat(mockMvc.perform(as("/api/vehicles/state", someone, type)).andReturn().getResponse().getStatus())
                    .as(type).isEqualTo(403);
            assertThat(mockMvc.perform(as("/api/vehicles/" + busA1 + "/state", someone, type)).andReturn().getResponse().getStatus())
                    .as(type).isEqualTo(403);
        }
        // No identity at all, or one that is not a valid id.
        assertThat(mockMvc.perform(as("/api/vehicles/state", null, null)).andReturn().getResponse().getStatus()).isEqualTo(403);
        assertThat(mockMvc.perform(as("/api/vehicles/state", someone, null)).andReturn().getResponse().getStatus()).isEqualTo(403);
        assertThat(mockMvc.perform(as("/api/vehicles/state", "not-a-uuid", "mot")).andReturn().getResponse().getStatus()).isEqualTo(403);
    }

    @Test
    @DisplayName("INC-024: an operator whose link cannot be confirmed is refused, not shown everything")
    void unconfirmedOperatorRefused() throws Exception {
        // Not linked to any operator, or core-service unreachable: both look like an empty answer.
        when(coreServiceClient.getOperatorIdForUser(any())).thenReturn(Optional.empty());
        assertThat(mockMvc.perform(as("/api/vehicles/state", UUID.randomUUID().toString(), "operator"))
                .andReturn().getResponse().getStatus()).isEqualTo(403);
        assertThat(mockMvc.perform(as("/api/vehicles/" + busA1 + "/state", UUID.randomUUID().toString(), "operator"))
                .andReturn().getResponse().getStatus()).isEqualTo(403);
    }

    @Test
    @DisplayName("INC-024: vehicle state stored by ingest is readable by the owning operator and no other")
    void ingestedStateFollowsItsOperator() throws Exception {
        UUID deviceBusB = busB1;
        Device device = deviceRepository.save(Device.builder()
                .serialNumber("IT-ISO-" + UUID.randomUUID()).deviceTypeCode("GPS_TRACKER").status(DeviceStatus.ACTIVE).build());
        assignmentRepository.save(DeviceAssignment.builder().deviceId(device.getId()).busId(deviceBusB).build());
        when(coreServiceClient.getOperatorIdForBus(deviceBusB)).thenReturn(Optional.of(operatorB));

        VehicleTelemetryPayload payload = VehicleTelemetryPayload.builder()
                .ignition(true).fuel(VehicleTelemetryPayload.Fuel.builder().levelPct(33.0).build()).build();
        // A newer timestamp than the seeded row, so ingest replaces it rather than treating it as stale.
        ingestService.ingestVehicleTelemetry(device.getId(),
                VehicleTelemetryIngestRequest.builder().deviceTimestamp(Instant.now().plusSeconds(60)).payload(payload).build());

        JsonNode asB = json(mockMvc.perform(as("/api/vehicles/" + deviceBusB + "/state", userB.toString(), "operator")).andReturn());
        assertThat(asB.get("snapshot").get("fuel").get("levelPct").asDouble()).isEqualTo(33.0);
        assertThat(mockMvc.perform(as("/api/vehicles/" + deviceBusB + "/state", userA.toString(), "operator"))
                .andReturn().getResponse().getStatus()).isEqualTo(404);
    }

    // --- the database itself, as the runtime role ---------------------------------------------

    @Test
    @DisplayName("INC-024: with no tenant context the runtime role reads nothing and writes nothing")
    void noContextMeansNothing() {
        assertThat(count("bus_vehicle_state")).isZero();
        assertThat(count("bus_active_alert")).isZero();
        assertThatThrownBy(() -> jdbc.update("insert into bus_vehicle_state (bus_id, device_id, snapshot, device_timestamp, ingested_at) "
                + "values (?, ?, '{}'::jsonb, now(), now())", UUID.randomUUID(), UUID.randomUUID()))
                .rootCause().hasMessageContaining("violates row-level security policy");
    }

    @Test
    @DisplayName("INC-024: an operator context sees only its own rows even for an unfiltered query, and cannot write")
    void operatorContextReadsOwnAndWritesNothing() {
        assertThat(countAsOperator(operatorA, "bus_vehicle_state")).isEqualTo(2);
        assertThat(countAsOperator(operatorB, "bus_vehicle_state")).isEqualTo(1);
        assertThat(countAsOperator(operatorA, "bus_active_alert")).isEqualTo(1);
        // A random operator sees nothing, however many rows exist.
        assertThat(countAsOperator(UUID.randomUUID(), "bus_vehicle_state")).isZero();

        // Writes: an update or delete touches no rows (none is visible to write), an insert is refused.
        assertThat(updateAsOperator(operatorA, "update bus_vehicle_state set operator_id = ?", operatorB)).isZero();
        assertThat(updateAsOperator(operatorA, "delete from bus_vehicle_state")).isZero();
        assertThat(updateAsOperator(operatorA, "delete from bus_active_alert")).isZero();
        assertThatThrownBy(() -> updateAsOperator(operatorA,
                "insert into bus_vehicle_state (bus_id, operator_id, device_id, snapshot, device_timestamp, ingested_at) "
                        + "values (?, ?, ?, '{}'::jsonb, now(), now())", UUID.randomUUID(), operatorA, UUID.randomUUID()))
                .rootCause().hasMessageContaining("violates row-level security policy");
        assertThat(countAsOperator(operatorA, "bus_vehicle_state")).isEqualTo(2);
    }

    @Test
    @DisplayName("INC-024: staff read every row but cannot write; only the ingest pipeline writes")
    void staffReadIngestWrites() {
        assertThat(countAsStaff("bus_vehicle_state")).isEqualTo(4);
        Integer deletedByStaff = tx.execute(status -> {
            tenantContext.asStaff();
            return jdbc.update("delete from bus_vehicle_state");
        });
        assertThat(deletedByStaff).isZero();

        Integer updated = tx.execute(status -> {
            tenantContext.asIngest();
            return jdbc.update("update bus_vehicle_state set trip_id = ? where bus_id = ?", UUID.randomUUID(), busA1);
        });
        assertThat(updated).isEqualTo(1);
    }

    @Test
    @DisplayName("INC-024: the runtime role cannot switch off, alter or step around the policy")
    void runtimeRoleCannotBypass() throws Exception {
        try (Connection c = runtimeConnection(); Statement s = c.createStatement()) {
            ResultSet attributes = s.executeQuery("select rolsuper, rolbypassrls, rolcreaterole from pg_roles where rolname = current_user");
            assertThat(attributes.next()).isTrue();
            assertThat(attributes.getBoolean(1)).as("superuser").isFalse();
            assertThat(attributes.getBoolean(2)).as("bypassrls").isFalse();
            assertThat(attributes.getBoolean(3)).as("createrole").isFalse();

            ResultSet owned = s.executeQuery("select count(*) from pg_class c join pg_roles r on r.oid = c.relowner "
                    + "where r.rolname = current_user and c.relkind = 'r'");
            owned.next();
            assertThat(owned.getLong(1)).as("tables owned").isZero();

            for (String forbidden : List.of(
                    "alter table bus_vehicle_state disable row level security",
                    "alter table bus_vehicle_state no force row level security",
                    "drop policy vehicle_state_select on bus_vehicle_state",
                    "create policy leak on bus_vehicle_state for select using (true)",
                    "create table stolen (a int)",
                    "set role postgres",
                    "select count(*) from flyway_schema_history")) {
                assertThatThrownBy(() -> s.execute(forbidden)).as(forbidden).isInstanceOf(SQLException.class);
            }
        }
    }

    @Test
    @DisplayName("INC-024: a declared context ends with its transaction and never reaches the next caller")
    void contextDoesNotOutliveItsTransaction() throws Exception {
        try (Connection c = runtimeConnection(); Statement s = c.createStatement()) {
            c.setAutoCommit(false);
            s.execute("select set_config('app.actor', 'staff', true)");
            s.execute("select set_config('app.operator_id', '" + operatorA + "', true)");
            c.commit();
            // Same physical connection, next transaction: nothing carried over, so nothing is visible.
            ResultSet leftover = s.executeQuery("select nullif(current_setting('app.actor', true), ''), count(*) from bus_vehicle_state");
            leftover.next();
            assertThat(leftover.getString(1)).isNull();
            assertThat(leftover.getLong(2)).isZero();
        }

        // And through the pool: alternating callers over many transactions never see each other's context.
        for (int i = 0; i < 30; i++) {
            assertThat(countAsOperator(operatorA, "bus_vehicle_state")).isEqualTo(2);
            assertThat(count("bus_vehicle_state")).isZero();
            assertThat(countAsOperator(operatorB, "bus_vehicle_state")).isEqualTo(1);
            assertThat(countAsStaff("bus_vehicle_state")).isEqualTo(4);
            assertThat(count("bus_vehicle_state")).isZero();
        }
    }

    @Test
    @DisplayName("INC-024: declaring a tenant context outside a transaction is an error")
    void contextNeedsATransaction() {
        assertThatThrownBy(() -> tenantContext.asStaff()).isInstanceOf(IllegalTransactionStateException.class);
        assertThatThrownBy(() -> tenantContext.asOperator(operatorA)).isInstanceOf(IllegalTransactionStateException.class);
        assertThatThrownBy(() -> tenantContext.asIngest()).isInstanceOf(IllegalTransactionStateException.class);
    }

    // --- the suite must fail when the policy is removed ----------------------------------------

    @Test
    @DisplayName("INC-024: with the policy switched off an operator WOULD read other operators' rows, so this suite is sensitive to it")
    void suiteFailsWhenPolicyRemoved() throws Exception {
        try (Connection owner = ownerConnection(); Statement s = owner.createStatement()) {
            owner.setAutoCommit(false);
            try {
                long guarded = visibleAsOperatorA(s);
                assertThat(guarded).as("with the policy in place").isEqualTo(2);

                s.execute("reset role");
                s.execute("alter table bus_vehicle_state disable row level security");
                long unguarded = visibleAsOperatorA(s);
                assertThat(unguarded).as("with row-level security disabled").isEqualTo(4);
            } finally {
                owner.rollback(); // DDL is transactional: the policy is back.
            }
        }
        try (Connection owner = ownerConnection(); Statement s = owner.createStatement()) {
            ResultSet rs = s.executeQuery("select relrowsecurity, relforcerowsecurity from pg_class where relname = 'bus_vehicle_state'");
            rs.next();
            assertThat(rs.getBoolean(1)).as("enabled").isTrue();
            assertThat(rs.getBoolean(2)).as("forced").isTrue();
        }
    }

    private long visibleAsOperatorA(Statement s) throws SQLException {
        s.execute("set role " + APP_USER);
        s.execute("select set_config('app.actor', 'operator', true), set_config('app.operator_id', '" + operatorA + "', true)");
        ResultSet rs = s.executeQuery("select count(*) from bus_vehicle_state");
        rs.next();
        long count = rs.getLong(1);
        s.execute("reset role");
        return count;
    }
}
