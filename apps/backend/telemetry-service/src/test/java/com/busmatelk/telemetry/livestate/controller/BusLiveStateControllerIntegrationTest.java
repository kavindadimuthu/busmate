package com.busmatelk.telemetry.livestate.controller;

import com.busmatelk.telemetry.AbstractPostgresIntegrationTest;
import com.busmatelk.telemetry.livestate.entity.BusLiveState;
import com.busmatelk.telemetry.livestate.repository.BusLiveStateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.time.Instant;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Exercises the live-position read model (IoT Platform Layer plan, Phase 3): unauthenticated GET
 * (permitAll — see SecurityConfig) returns the latest known position for a bus, or 404 if
 * telemetry-service has never heard from it.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@AutoConfigureWebMvc
@EmbeddedKafka(partitions = 1, controlledShutdown = true)
@TestPropertySource(properties = "spring.kafka.bootstrap-servers=${spring.embedded.kafka.brokers}")
@Transactional
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@DisplayName("Bus Live State Controller Integration Tests")
class BusLiveStateControllerIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private BusLiveStateRepository liveStateRepository;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
    }

    @Test
    @DisplayName("returns 404 for a bus with no live state yet")
    void returns404ForUnknownBus() throws Exception {
        mockMvc.perform(get("/api/live/buses/{busId}", UUID.randomUUID()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("returns the latest position for a bus that has reported")
    void returnsLatestPositionForKnownBus() throws Exception {
        UUID busId = UUID.randomUUID();
        UUID deviceId = UUID.randomUUID();
        liveStateRepository.save(BusLiveState.builder()
                .busId(busId)
                .deviceId(deviceId)
                .lat(6.9271)
                .lng(79.8612)
                .speedKmh(42.0)
                .headingDeg(180.0)
                .deviceTimestamp(Instant.now())
                .ingestedAt(Instant.now())
                .build());

        mockMvc.perform(get("/api/live/buses/{busId}", busId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.busId").value(busId.toString()))
                .andExpect(jsonPath("$.deviceId").value(deviceId.toString()))
                .andExpect(jsonPath("$.lat").value(6.9271))
                .andExpect(jsonPath("$.speedKmh").value(42.0));
    }

    @Test
    @DisplayName("lists every bus with recent telemetry")
    void listsAllLiveBuses() throws Exception {
        liveStateRepository.save(BusLiveState.builder()
                .busId(UUID.randomUUID())
                .lat(1.0).lng(1.0)
                .ingestedAt(Instant.now())
                .build());
        liveStateRepository.save(BusLiveState.builder()
                .busId(UUID.randomUUID())
                .lat(2.0).lng(2.0)
                .ingestedAt(Instant.now())
                .build());

        mockMvc.perform(get("/api/live/buses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }
}
