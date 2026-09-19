package com.busmate.ticketing_service.operator;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.busmate.ticketing_service.AbstractPostgresIntegrationTest;
import com.busmate.ticketing_service.core.CoreServiceClient;
import com.busmate.ticketing_service.entity.Tickets;
import com.busmate.ticketing_service.repository.TicketRepo;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * INC-021: a ticket is stamped with the operator it was sold for at the moment of sale, and the
 * admin/operator sales listing is scoped by the server from the caller's own account - never from
 * a bus-id list the caller sends.
 */
@SpringBootTest
@AutoConfigureMockMvc
class TicketOperatorScopeIntegrationTest extends AbstractPostgresIntegrationTest {

    private static final String OPERATOR_A = "operator-a-id";
    private static final String OPERATOR_B = "operator-b-id";
    private static final String OPERATOR_A_USER = "user-operator-a";
    private static final String OPERATOR_B_USER = "user-operator-b";

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private TicketRepo ticketRepo;

    @MockitoBean private CoreServiceClient coreServiceClient;

    @BeforeEach
    void setUp() {
        ticketRepo.deleteAll();
        when(coreServiceClient.getOperatorIdForUser(OPERATOR_A_USER)).thenReturn(Optional.of(OPERATOR_A));
        when(coreServiceClient.getOperatorIdForUser(OPERATOR_B_USER)).thenReturn(Optional.of(OPERATOR_B));
        when(coreServiceClient.getOperatorIdForUser(eq("no-operator-account"))).thenReturn(Optional.empty());
        when(coreServiceClient.getOperatorIdForBus(anyString())).thenReturn(Optional.of(OPERATOR_A));
    }

    private Tickets ticketFor(String operatorId, String bus) {
        Tickets ticket = new Tickets();
        ticket.setBusId(bus);
        ticket.setTripId("trip-" + bus);
        ticket.setFareAmount(new BigDecimal("50.00"));
        ticket.setIssueMethod(Tickets.IssueMethod.CONDUCTOR);
        ticket.setStatus(Tickets.Status.VALID);
        ticket.setOperatorId(operatorId);
        return ticketRepo.save(ticket);
    }

    @Test
    @DisplayName("INC-021 an operator sees only their own operator's tickets, whatever busIds they send")
    void inc021_operatorScopedToOwnTickets() throws Exception {
        ticketFor(OPERATOR_A, "bus-1");
        ticketFor(OPERATOR_A, "bus-2");
        ticketFor(OPERATOR_B, "bus-3");

        mockMvc.perform(get("/api/v1/tickets")
                        .header("x-user-id", OPERATOR_A_USER)
                        .header("x-user-type", "operator")
                        // Trying to see operator B's tickets by naming their bus directly.
                        .param("busIds", "bus-3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(0));

        mockMvc.perform(get("/api/v1/tickets")
                        .header("x-user-id", OPERATOR_A_USER)
                        .header("x-user-type", "operator"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.content[*].operatorId", org.hamcrest.Matchers.everyItem(
                        org.hamcrest.Matchers.is(OPERATOR_A))));
    }

    @Test
    @DisplayName("INC-021 MOT and admin see every operator's tickets")
    void inc021_staffSeeEverything() throws Exception {
        ticketFor(OPERATOR_A, "bus-1");
        ticketFor(OPERATOR_B, "bus-2");

        mockMvc.perform(get("/api/v1/tickets").header("x-user-id", "mot-1").header("x-user-type", "mot"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2));
        mockMvc.perform(get("/api/v1/tickets").header("x-user-id", "admin-1").header("x-user-type", "admin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2));
    }

    @Test
    @DisplayName("INC-021 a passenger or conductor cannot reach the sales listing at all")
    void inc021_nonStaffRefused() throws Exception {
        mockMvc.perform(get("/api/v1/tickets").header("x-user-id", "p1").header("x-user-type", "passenger"))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/tickets").header("x-user-id", "c1").header("x-user-type", "conductor"))
                .andExpect(status().isForbidden());
        // No identity headers at all: refused as unauthenticated, not shown anything.
        mockMvc.perform(get("/api/v1/tickets"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("INC-021 an operator account with no confirmed operator link is refused, not shown everything")
    void inc021_unconfirmedOperatorRefused() throws Exception {
        ticketFor(OPERATOR_A, "bus-1");
        mockMvc.perform(get("/api/v1/tickets").header("x-user-id", "no-operator-account").header("x-user-type", "operator"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("INC-021 a conductor-issued ticket is stamped with the bus's operator")
    void inc021_conductorIssuedTicketIsStamped() throws Exception {
        Map<String, Object> request = Map.of(
                "busId", "bus-99",
                "tripId", "trip-99",
                "conductorId", "conductor-1",
                "seatNumber", "A1",
                "fareAmount", new BigDecimal("40.00"),
                "paymentMethod", "CASH");

        mockMvc.perform(post("/api/v1/tickets/conductor/issue")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        assertThat(ticketRepo.findAll())
                .filteredOn(t -> "bus-99".equals(t.getBusId()))
                .singleElement()
                .extracting(Tickets::getOperatorId)
                .isEqualTo(OPERATOR_A);
    }
}
