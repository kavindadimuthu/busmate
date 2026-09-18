package com.busmate.routeschedule.security;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import com.busmate.routeschedule.AbstractPostgresIntegrationTest;
import com.busmate.routeschedule.fleet.entity.Bus;
import com.busmate.routeschedule.fleet.entity.Operator;
import com.busmate.routeschedule.fleet.enums.OperatorTypeEnum;
import com.busmate.routeschedule.fleet.repository.BusRepository;
import com.busmate.routeschedule.fleet.repository.OperatorRepository;
import com.busmate.routeschedule.shared.enums.StatusEnum;

/**
 * INC-016: an operator reaches only their own records; staff reach all; the public allow-list
 * stays public. Runs the real security chain (JWT filter, URL rules, method security) with the
 * caller injected as a Spring Security principal — name = user-service user id, role = user type.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("INC-016 operator data isolation")
class OperatorDataIsolationIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired
    private WebApplicationContext context;
    @Autowired
    private OperatorRepository operatorRepository;
    @Autowired
    private BusRepository busRepository;

    private MockMvc mvc;

    private final UUID userA = UUID.randomUUID();
    private final UUID userB = UUID.randomUUID();
    private Operator operatorA;
    private Operator operatorB;
    private Bus busA;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        operatorA = operator("Operator A", userA);
        operatorB = operator("Operator B", userB);
        busA = bus(operatorA, "NA-" + shortId());
        bus(operatorB, "NB-" + shortId());
    }

    @Test
    @DisplayName("INC-016 anonymous callers cannot list fleet, permits, trips or operators")
    void inc016_anonymousListsRefused() throws Exception {
        mvc.perform(get("/api/buses")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/permits")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/trips")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/operators")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/bus-permit-assignments")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/bus-operator/" + operatorA.getId() + "/buses")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("INC-016 the public allow-list still answers without a login")
    void inc016_publicReadsStayPublic() throws Exception {
        mvc.perform(get("/api/buses/" + busA.getId())).andExpect(status().isOk());
        mvc.perform(get("/api/stops")).andExpect(status().isOk());
        mvc.perform(get("/api/routes")).andExpect(status().isOk());
    }

    @Test
    @DisplayName("INC-016 an operator is refused another operator's records and allowed their own")
    void inc016_operatorScopedToOwnRecords() throws Exception {
        mvc.perform(get("/api/v1/bus-operator/" + operatorB.getId() + "/buses").with(as(userA, "OPERATOR")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/bus-operator/" + operatorB.getId() + "/permits").with(as(userA, "OPERATOR")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/bus-operator/" + operatorB.getId() + "/trips").with(as(userA, "OPERATOR")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/bus-operator/" + operatorA.getId() + "/buses").with(as(userA, "OPERATOR")))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("INC-016 staff may use any operator's scoped endpoints")
    void inc016_staffReachEveryOperator() throws Exception {
        mvc.perform(get("/api/v1/bus-operator/" + operatorB.getId() + "/buses").with(as(UUID.randomUUID(), "MOT")))
                .andExpect(status().isOk());
        mvc.perform(get("/api/buses").with(as(UUID.randomUUID(), "ADMIN"))).andExpect(status().isOk());
    }

    @Test
    @DisplayName("INC-016 operators, conductors and passengers cannot use the staff-wide endpoints")
    void inc016_nonStaffRefusedStaffEndpoints() throws Exception {
        String body = "{\"operatorId\":\"" + operatorA.getId() + "\",\"ntcRegistrationNumber\":\"X-" + shortId()
                + "\",\"plateNumber\":\"P-" + shortId() + "\",\"capacity\":40}";
        for (String role : new String[] {"PASSENGER", "CONDUCTOR", "OPERATOR"}) {
            mvc.perform(post("/api/buses").with(as(userA, role)).contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isForbidden());
            mvc.perform(get("/api/buses").with(as(userA, role))).andExpect(status().isForbidden());
        }
        mvc.perform(post("/api/buses").with(as(UUID.randomUUID(), "MOT")).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("INC-016 a conductor reads only their own trips")
    void inc016_conductorScopedToSelf() throws Exception {
        UUID conductor = UUID.randomUUID();
        mvc.perform(get("/api/v1/conductor/" + conductor + "/trips").with(as(conductor, "CONDUCTOR")))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/conductor/" + UUID.randomUUID() + "/trips").with(as(conductor, "CONDUCTOR")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/trips/conductor/" + UUID.randomUUID()).with(as(conductor, "CONDUCTOR")))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("INC-016 an operator resolves only their own operator record by user id")
    void inc016_operatorByUserIsSelfOnly() throws Exception {
        mvc.perform(get("/api/operators/by-user/" + userA).with(as(userA, "OPERATOR"))).andExpect(status().isOk());
        mvc.perform(get("/api/operators/by-user/" + userB).with(as(userA, "OPERATOR"))).andExpect(status().isForbidden());
    }

    private static RequestPostProcessor as(UUID userId, String role) {
        return user(userId.toString()).roles(role);
    }

    private Operator operator(String name, UUID userId) {
        Operator operator = new Operator();
        operator.setId(UUID.randomUUID());
        operator.setName(name);
        operator.setOperatorType(OperatorTypeEnum.PRIVATE);
        operator.setStatus(StatusEnum.active);
        operator.setUserId(userId);
        return operatorRepository.save(operator);
    }

    private Bus bus(Operator operator, String plate) {
        Bus bus = new Bus();
        bus.setOperator(operator);
        bus.setPlateNumber(plate);
        bus.setNtcRegistrationNumber("NTC-" + plate);
        bus.setCapacity(49);
        bus.setStatus(StatusEnum.active);
        return busRepository.save(bus);
    }

    private static String shortId() {
        return UUID.randomUUID().toString().substring(0, 8);
    }
}
