package com.busmatelk.telemetry.device.controller;

import com.busmatelk.telemetry.AbstractPostgresIntegrationTest;
import com.busmatelk.telemetry.device.dto.AssignDeviceRequest;
import com.busmatelk.telemetry.device.dto.RegisterDeviceRequest;
import com.busmatelk.telemetry.device.repository.DeviceRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Exercises the device registry API end to end against a real Postgres + real Flyway migrations
 * (IoT Platform Layer plan, Phase 1): registration issues a real token, duplicate serials and
 * double-assignment are rejected, disable revokes credentials, and the ADMIN/MOT role gate holds.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@AutoConfigureWebMvc
@EmbeddedKafka(partitions = 1, controlledShutdown = true)
@TestPropertySource(properties = "spring.kafka.bootstrap-servers=${spring.embedded.kafka.brokers}")
@Transactional
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@DisplayName("Device Controller Integration Tests")
class DeviceControllerIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private DeviceRepository deviceRepository;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
    }

    private RegisterDeviceRequest validRequest(String serial) {
        return RegisterDeviceRequest.builder()
                .serialNumber(serial)
                .deviceTypeCode("GPS_TRACKER")
                .label("Test tracker")
                .build();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    @DisplayName("registers a device and returns a one-time token")
    void registersDeviceAndReturnsToken() throws Exception {
        mockMvc.perform(post("/api/devices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest("IT-SERIAL-001"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.device.serialNumber").value("IT-SERIAL-001"))
                .andExpect(jsonPath("$.device.status").value("PROVISIONED"))
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.token").value(org.hamcrest.Matchers.startsWith("bmt_")));
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    @DisplayName("rejects a duplicate serial number")
    void rejectsDuplicateSerialNumber() throws Exception {
        mockMvc.perform(post("/api/devices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest("IT-SERIAL-DUP"))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/devices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest("IT-SERIAL-DUP"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("CONFLICT"));
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    @DisplayName("rejects an unknown device type")
    void rejectsUnknownDeviceType() throws Exception {
        RegisterDeviceRequest request = RegisterDeviceRequest.builder()
                .serialNumber("IT-SERIAL-BADTYPE")
                .deviceTypeCode("NOT_A_REAL_TYPE")
                .build();

        mockMvc.perform(post("/api/devices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    @DisplayName("assigns a device to a bus, then rejects assigning another device to the same bus")
    void assignsDeviceAndRejectsDoubleAssignment() throws Exception {
        UUID busId = UUID.randomUUID();

        String firstDeviceJson = mockMvc.perform(post("/api/devices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest("IT-SERIAL-BUS-1"))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        UUID firstDeviceId = UUID.fromString(objectMapper.readTree(firstDeviceJson).at("/device/id").asText());

        mockMvc.perform(post("/api/devices/{id}/assignment", firstDeviceId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AssignDeviceRequest(busId))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.busId").value(busId.toString()));

        mockMvc.perform(get("/api/devices/{id}", firstDeviceId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentBusId").value(busId.toString()));

        String secondDeviceJson = mockMvc.perform(post("/api/devices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest("IT-SERIAL-BUS-2"))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        UUID secondDeviceId = UUID.fromString(objectMapper.readTree(secondDeviceJson).at("/device/id").asText());

        mockMvc.perform(post("/api/devices/{id}/assignment", secondDeviceId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AssignDeviceRequest(busId))))
                .andExpect(status().isConflict());

        mockMvc.perform(delete("/api/devices/{id}/assignment", firstDeviceId))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/devices/{id}/assignment", secondDeviceId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AssignDeviceRequest(busId))))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    @DisplayName("disabling a device revokes its token, and it can be re-enabled")
    void disableRevokesCredentialAndAllowsReEnable() throws Exception {
        String deviceJson = mockMvc.perform(post("/api/devices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest("IT-SERIAL-DISABLE"))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        UUID deviceId = UUID.fromString(objectMapper.readTree(deviceJson).at("/device/id").asText());

        mockMvc.perform(post("/api/devices/{id}/disable", deviceId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DISABLED"));

        mockMvc.perform(post("/api/devices/{id}/enable", deviceId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PROVISIONED"));
    }

    // The three tests below deliberately do NOT use @WithMockUser: this endpoint's own
    // @RequestHeader("x-user-id") binding means the request must carry an x-user-id header, and
    // GatewayAuthenticationFilter (active in the "test" profile, same as prod — MockJwtAuthenticationFilter
    // is dev-only) treats the presence of that header as "derive identity from gateway headers",
    // overwriting whatever @WithMockUser put in the SecurityContext with a role built from
    // x-user-type (defaulting to ROLE_USER if absent — silently NOT the role the test intended).
    // Setting x-user-type explicitly, the way the real gateway does, is what makes these tests
    // exercise the actual production auth path instead of fighting it.

    @Test
    @DisplayName("self-provisions a CONDUCTOR_APP device on first call, tied to the caller's user id (Phase 4)")
    void provisionsConductorDeviceOnFirstCall() throws Exception {
        UUID ownerUserId = UUID.randomUUID();

        String responseJson = mockMvc.perform(post("/api/devices/provision-conductor")
                        .header("x-user-id", ownerUserId.toString())
                        .header("x-user-type", "conductor"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.device.deviceTypeCode").value("CONDUCTOR_APP"))
                .andExpect(jsonPath("$.token").value(org.hamcrest.Matchers.startsWith("bmt_")))
                .andReturn().getResponse().getContentAsString();

        UUID deviceId = UUID.fromString(objectMapper.readTree(responseJson).at("/device/id").asText());
        assertThat(deviceRepository.findById(deviceId).orElseThrow().getOwnerUserId()).isEqualTo(ownerUserId);
    }

    @Test
    @DisplayName("re-provisioning the same conductor reuses their existing device with a rotated token")
    void reProvisioningReusesExistingDeviceWithFreshToken() throws Exception {
        UUID ownerUserId = UUID.randomUUID();

        String firstResponse = mockMvc.perform(post("/api/devices/provision-conductor")
                        .header("x-user-id", ownerUserId.toString())
                        .header("x-user-type", "conductor"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        UUID firstDeviceId = UUID.fromString(objectMapper.readTree(firstResponse).at("/device/id").asText());
        String firstToken = objectMapper.readTree(firstResponse).at("/token").asText();

        String secondResponse = mockMvc.perform(post("/api/devices/provision-conductor")
                        .header("x-user-id", ownerUserId.toString())
                        .header("x-user-type", "conductor"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        UUID secondDeviceId = UUID.fromString(objectMapper.readTree(secondResponse).at("/device/id").asText());
        String secondToken = objectMapper.readTree(secondResponse).at("/token").asText();

        assertThat(secondDeviceId).isEqualTo(firstDeviceId);
        assertThat(secondToken).isNotEqualTo(firstToken);
    }

    @Test
    @DisplayName("forbids staff roles from the conductor self-provisioning endpoint")
    void forbidsStaffFromConductorProvisioning() throws Exception {
        mockMvc.perform(post("/api/devices/provision-conductor")
                        .header("x-user-id", UUID.randomUUID().toString())
                        .header("x-user-type", "admin"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("rejects unauthenticated requests")
    void rejectsUnauthenticated() throws Exception {
        // No AuthenticationEntryPoint is configured (this service has no httpBasic()/oauth2
        // resource-server setup, unlike core-service), so Spring Security's default
        // Http403ForbiddenEntryPoint applies — an anonymous caller and a wrongly-role'd caller
        // (see forbidsNonStaffRole below) both come back 403, not 401.
        mockMvc.perform(get("/api/devices"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "conductor", roles = "CONDUCTOR")
    @DisplayName("forbids roles other than ADMIN/MOT")
    void forbidsNonStaffRole() throws Exception {
        mockMvc.perform(get("/api/devices"))
                .andExpect(status().isForbidden());
    }
}
