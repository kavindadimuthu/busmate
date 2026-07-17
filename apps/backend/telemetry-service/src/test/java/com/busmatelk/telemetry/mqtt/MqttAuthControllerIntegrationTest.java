package com.busmatelk.telemetry.mqtt;

import com.busmatelk.telemetry.AbstractPostgresIntegrationTest;
import com.busmatelk.telemetry.device.entity.CredentialType;
import com.busmatelk.telemetry.device.entity.Device;
import com.busmatelk.telemetry.device.entity.DeviceCredential;
import com.busmatelk.telemetry.device.entity.DeviceStatus;
import com.busmatelk.telemetry.device.repository.DeviceCredentialRepository;
import com.busmatelk.telemetry.device.repository.DeviceRepository;
import com.busmatelk.telemetry.device.service.DeviceTokens;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.util.HashMap;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Exercises the MQTT broker's HTTP auth webhook (IoT Platform Layer plan, Phase 4) — the same
 * device-credential check the HTTPS path's DeviceTokenAuthenticationFilter performs, just wrapped
 * in the {@code {"result":"allow"|"deny"}} response shape EMQX's HTTP authenticator expects (see
 * config/mqtt/emqx.conf).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@AutoConfigureWebMvc
@EmbeddedKafka(partitions = 1, controlledShutdown = true)
@TestPropertySource(properties = "spring.kafka.bootstrap-servers=${spring.embedded.kafka.brokers}")
@Transactional
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@DisplayName("MQTT Auth Controller Integration Tests")
class MqttAuthControllerIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private DeviceCredentialRepository credentialRepository;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
    }

    private String authBody(String username, String password) throws Exception {
        var body = new HashMap<String, Object>();
        body.put("username", username);
        body.put("password", password);
        body.put("clientid", "test-client-" + UUID.randomUUID());
        return objectMapper.writeValueAsString(body);
    }

    @Test
    @DisplayName("allows a valid, active device's token")
    void allowsValidActiveDevice() throws Exception {
        Device device = deviceRepository.save(Device.builder()
                .serialNumber("IT-MQTT-" + UUID.randomUUID())
                .deviceTypeCode("GPS_TRACKER")
                .status(DeviceStatus.ACTIVE)
                .build());
        String token = DeviceTokens.generate();
        credentialRepository.save(DeviceCredential.builder()
                .deviceId(device.getId())
                .credentialType(CredentialType.TOKEN_HASH)
                .secretHash(DeviceTokens.hash(token))
                .build());

        mockMvc.perform(post("/internal/mqtt-auth")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(authBody("anything", token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result").value("allow"));
    }

    @Test
    @DisplayName("denies an unknown token")
    void deniesUnknownToken() throws Exception {
        mockMvc.perform(post("/internal/mqtt-auth")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(authBody("anything", "bmt_not_a_real_token")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result").value("deny"));
    }

    @Test
    @DisplayName("denies a password with no bmt_ prefix")
    void deniesNonTokenPassword() throws Exception {
        mockMvc.perform(post("/internal/mqtt-auth")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(authBody("anything", "changeme")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result").value("deny"));
    }

    @Test
    @DisplayName("denies a disabled device's still-technically-hashable token")
    void deniesDisabledDevice() throws Exception {
        Device device = deviceRepository.save(Device.builder()
                .serialNumber("IT-MQTT-DISABLED-" + UUID.randomUUID())
                .deviceTypeCode("GPS_TRACKER")
                .status(DeviceStatus.DISABLED)
                .build());
        String token = DeviceTokens.generate();
        credentialRepository.save(DeviceCredential.builder()
                .deviceId(device.getId())
                .credentialType(CredentialType.TOKEN_HASH)
                .secretHash(DeviceTokens.hash(token))
                .build());

        mockMvc.perform(post("/internal/mqtt-auth")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(authBody("anything", token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result").value("deny"));
    }
}
