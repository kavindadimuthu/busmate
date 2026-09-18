package com.busmate.routeschedule.licensing;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.LocalTime;
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
import com.busmate.routeschedule.fleet.enums.ServiceClassEnum;
import com.busmate.routeschedule.licensing.entity.PassengerServicePermit;
import com.busmate.routeschedule.licensing.enums.PassengerServicePermitTypeEnum;
import com.busmate.routeschedule.network.entity.RouteGroup;
import com.busmate.routeschedule.support.OperationsFixtures;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("INC-017 operator permit self-service")
class OperatorPermitSelfServiceIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private OperationsFixtures fx;

    private MockMvc mvc;
    private final UUID userA = UUID.randomUUID();
    private final UUID userB = UUID.randomUUID();
    private Operator operatorA;
    private Operator operatorB;
    private RouteGroup group;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        operatorA = fx.operator("A", userA);
        operatorB = fx.operator("B", userB);
        group = fx.routeGroup();
    }

    private String base(Operator operator) {
        return "/api/v1/bus-operator/" + operator.getId() + "/permits";
    }

    private String permitJson(String number, String type, int maxBuses) {
        return "{\"routeGroupId\":\"" + group.getId() + "\",\"permitNumber\":\"" + number + "\",\"issueDate\":\""
                + LocalDate.now().minusMonths(1) + "\",\"expiryDate\":\"" + LocalDate.now().plusYears(2)
                + "\",\"maximumBusAssigned\":" + maxBuses + ",\"permitType\":\"" + type + "\"}";
    }

    @Test
    @DisplayName("INC-017 an operator records a permit and it is active immediately")
    void inc017_createIsActive() throws Exception {
        mvc.perform(post(base(operatorA)).with(as(userA, "OPERATOR")).contentType(MediaType.APPLICATION_JSON)
                        .content(permitJson("PSP-NEW-1", "NORMAL", 2)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("active"))
                .andExpect(jsonPath("$.operatorId").value(operatorA.getId().toString()))
                .andExpect(jsonPath("$.activeBusCount").value(0));
    }

    @Test
    @DisplayName("INC-017 a permit number registered to another operator is a conflict, not an overwrite")
    void inc017_duplicateNumberConflicts() throws Exception {
        PassengerServicePermit theirs = fx.permit(operatorB, group, PassengerServicePermitTypeEnum.NORMAL, 2);
        mvc.perform(post(base(operatorA)).with(as(userA, "OPERATOR")).contentType(MediaType.APPLICATION_JSON)
                        .content(permitJson(theirs.getPermitNumber(), "NORMAL", 2)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("INC-017 an operator cannot read or edit another operator's permit")
    void inc017_otherOperatorsPermitHidden() throws Exception {
        PassengerServicePermit theirs = fx.permit(operatorB, group, PassengerServicePermitTypeEnum.NORMAL, 2);
        mvc.perform(put(base(operatorA) + "/" + theirs.getId()).with(as(userA, "OPERATOR"))
                        .contentType(MediaType.APPLICATION_JSON).content(permitJson("X-1", "NORMAL", 2)))
                .andExpect(status().isNotFound());
        mvc.perform(put(base(operatorB) + "/" + theirs.getId()).with(as(userA, "OPERATOR"))
                        .contentType(MediaType.APPLICATION_JSON).content(permitJson("X-1", "NORMAL", 2)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("INC-017 the operator's permit list is filtered and paged in the database")
    void inc017_listIsScopedAndPaged() throws Exception {
        for (int i = 0; i < 3; i++) {
            fx.permit(operatorA, group, PassengerServicePermitTypeEnum.NORMAL, 2);
        }
        fx.permit(operatorB, group, PassengerServicePermitTypeEnum.NORMAL, 2);
        mvc.perform(get(base(operatorA)).param("size", "2").with(as(userA, "OPERATOR")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.totalElements").value(3));
        mvc.perform(get(base(operatorA)).param("status", "active").with(as(userA, "OPERATOR")))
                .andExpect(jsonPath("$.totalElements").value(3));
        mvc.perform(get(base(operatorA)).param("status", "cancelled").with(as(userA, "OPERATOR")))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    @DisplayName("INC-017 linking a bus respects ownership, service class and the permit's cap")
    void inc017_linkRules() throws Exception {
        PassengerServicePermit permit = fx.permit(operatorA, group, PassengerServicePermitTypeEnum.LUXURY, 1);
        Bus luxury = fx.bus(operatorA, ServiceClassEnum.LUXURY);
        Bus secondLuxury = fx.bus(operatorA, ServiceClassEnum.LUXURY);
        Bus normal = fx.bus(operatorA, ServiceClassEnum.NORMAL);
        Bus theirs = fx.bus(operatorB, ServiceClassEnum.LUXURY);
        String links = base(operatorA) + "/" + permit.getId() + "/buses";

        mvc.perform(post(links).with(as(userA, "OPERATOR")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"busId\":\"" + normal.getId() + "\"}"))
                .andExpect(status().isConflict());
        mvc.perform(post(links).with(as(userA, "OPERATOR")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"busId\":\"" + theirs.getId() + "\"}"))
                .andExpect(status().isConflict());
        mvc.perform(post(links).with(as(userA, "OPERATOR")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"busId\":\"" + luxury.getId() + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.inForce").value(true));
        mvc.perform(post(links).with(as(userA, "OPERATOR")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"busId\":\"" + secondLuxury.getId() + "\"}"))
                .andExpect(status().isConflict());
        mvc.perform(get(links).with(as(userA, "OPERATOR")))
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    @DisplayName("INC-017 withdrawing a permit ends its bus links and records why")
    void inc017_withdrawEndsLinks() throws Exception {
        PassengerServicePermit permit = fx.permit(operatorA, group, PassengerServicePermitTypeEnum.NORMAL, 2);
        fx.link(fx.bus(operatorA, ServiceClassEnum.NORMAL), permit);
        mvc.perform(post(base(operatorA) + "/" + permit.getId() + "/withdraw").with(as(userA, "OPERATOR"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Route handed back\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("cancelled"))
                .andExpect(jsonPath("$.statusReason").value("Route handed back"))
                .andExpect(jsonPath("$.activeBusCount").value(0));
    }

    @Test
    @DisplayName("INC-017 MOT suspends a permit, it stops authorising buses, and MOT reinstates it")
    void inc017_motSuspendAndReinstate() throws Exception {
        PassengerServicePermit permit = fx.permit(operatorA, group, PassengerServicePermitTypeEnum.NORMAL, 2);
        Bus bus = fx.bus(operatorA, ServiceClassEnum.NORMAL);
        mvc.perform(post("/api/permits/" + permit.getId() + "/suspend").with(as(UUID.randomUUID(), "MOT"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Inspection pending\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("inactive"));
        mvc.perform(post(base(operatorA) + "/" + permit.getId() + "/buses").with(as(userA, "OPERATOR"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"busId\":\"" + bus.getId() + "\"}"))
                .andExpect(status().isConflict());
        mvc.perform(post("/api/permits/" + permit.getId() + "/suspend").with(as(userA, "OPERATOR"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"x\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/permits/" + permit.getId() + "/reinstate").with(as(UUID.randomUUID(), "MOT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("active"));
    }

    @Test
    @DisplayName("INC-017 a permit with trips on record cannot be deleted")
    void inc017_deleteGuard() throws Exception {
        PassengerServicePermit permit = fx.permit(operatorA, group, PassengerServicePermitTypeEnum.NORMAL, 2);
        fx.trip(fx.schedule(fx.route(group)), permit, LocalDate.now(), LocalTime.of(8, 0), LocalTime.of(10, 0));
        mvc.perform(delete("/api/permits/" + permit.getId()).with(as(UUID.randomUUID(), "MOT")))
                .andExpect(status().isConflict());
    }

    private static RequestPostProcessor as(UUID userId, String role) {
        return user(userId.toString()).roles(role);
    }
}
