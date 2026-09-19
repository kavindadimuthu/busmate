package com.busmate.routeschedule.fleet;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import com.busmate.routeschedule.AbstractPostgresIntegrationTest;
import com.busmate.routeschedule.fleet.entity.Bus;
import com.busmate.routeschedule.fleet.entity.Operator;
import com.busmate.routeschedule.fleet.enums.ServiceClassEnum;
import com.busmate.routeschedule.shared.client.ConductorDirectory;
import com.busmate.routeschedule.shared.client.ConductorDirectory.Conductor;
import com.busmate.routeschedule.support.OperationsFixtures;

/** INC-019 (design R5): a bus's default conductor must be an active conductor of its operator. */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("INC-019 default conductor")
class DefaultConductorIntegrationTest extends AbstractPostgresIntegrationTest {

    @MockitoBean private ConductorDirectory conductorDirectory;
    @Autowired private WebApplicationContext context;
    @Autowired private OperationsFixtures fx;

    private MockMvc mvc;
    private final UUID userA = UUID.randomUUID();
    private Operator operatorA;
    private Bus bus;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        operatorA = fx.operator("A", userA);
        bus = fx.bus(operatorA, ServiceClassEnum.NORMAL);
        when(conductorDirectory.find(any())).thenReturn(Optional.empty());
    }

    private org.springframework.test.web.servlet.ResultActions set(UUID conductor) throws Exception {
        return mvc.perform(put("/api/buses/" + bus.getId() + "/default-conductor")
                .with(user(userA.toString()).roles("OPERATOR"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(conductor == null ? "{\"conductorId\":null}" : "{\"conductorId\":\"" + conductor + "\"}"));
    }

    @Test
    @DisplayName("INC-019 an active conductor of the bus's operator can be the default")
    void inc019_ownActiveConductorAccepted() throws Exception {
        UUID c = UUID.randomUUID();
        when(conductorDirectory.find(c)).thenReturn(Optional.of(new Conductor(c, "C", "active", operatorA.getId().toString())));
        set(c).andExpect(status().isOk()).andExpect(jsonPath("$.defaultConductorId").value(c.toString()));
        set(null).andExpect(status().isOk()).andExpect(jsonPath("$.defaultConductorId").doesNotExist());
    }

    @Test
    @DisplayName("INC-019 another operator's, a suspended, or a non-conductor account is refused")
    void inc019_othersRefused() throws Exception {
        UUID other = UUID.randomUUID();
        UUID suspended = UUID.randomUUID();
        when(conductorDirectory.find(other)).thenReturn(Optional.of(new Conductor(other, "O", "active", UUID.randomUUID().toString())));
        when(conductorDirectory.find(suspended)).thenReturn(Optional.of(new Conductor(suspended, "S", "suspended", operatorA.getId().toString())));
        set(other).andExpect(status().isConflict());
        set(suspended).andExpect(status().isConflict());
        set(UUID.randomUUID()).andExpect(status().isBadRequest());
    }
}
