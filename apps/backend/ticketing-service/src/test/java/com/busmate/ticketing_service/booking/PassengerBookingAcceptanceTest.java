package com.busmate.ticketing_service.booking;

import com.busmate.ticketing_service.AbstractPostgresIntegrationTest;
import com.busmate.ticketing_service.core.BookingContext;
import com.busmate.ticketing_service.core.CoreServiceClient;
import com.busmate.ticketing_service.entity.BaseFare;
import com.busmate.ticketing_service.entity.RouteFare;
import com.busmate.ticketing_service.entity.Tickets;
import com.busmate.ticketing_service.repository.BaseFareRepo;
import com.busmate.ticketing_service.repository.RouteFareRepo;
import com.busmate.ticketing_service.repository.TicketRepo;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * INC-011 acceptance criteria: a passenger booking is priced, attributed and authorised by the
 * server.
 *
 * <p>core-service is stubbed, not run: these tests are about what ticketing-service does with the
 * facts it is given, and the contract between the two is a single record. Everything else is real
 * — real Postgres, real Flyway schema, real fare tables, real HTTP through the controller with the
 * identity headers api-gateway sets.
 */
@SpringBootTest
@AutoConfigureMockMvc
class PassengerBookingAcceptanceTest extends AbstractPostgresIntegrationTest {

    private static final String TRIP_ID = "11111111-1111-1111-1111-111111111111";
    private static final String BUS_ID = "22222222-2222-2222-2222-222222222222";
    private static final String ROUTE_ID = "33333333-3333-3333-3333-333333333333";
    private static final String FROM_STOP = "44444444-4444-4444-4444-444444444444";
    private static final String TO_STOP = "55555555-5555-5555-5555-555555555555";

    private static final String PASSENGER = "passenger-alice";
    private static final String OTHER_PASSENGER = "passenger-bob";

    /** Section 1 -> section 3 is a two-section journey: 30.00 normal, 50.00 semi-luxury. */
    private static final BigDecimal NORMAL_FARE = new BigDecimal("30.00");
    private static final BigDecimal SEMI_LUXURY_FARE = new BigDecimal("50.00");

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private TicketRepo ticketRepo;
    @Autowired
    private BaseFareRepo baseFareRepo;
    @Autowired
    private RouteFareRepo routeFareRepo;

    @MockitoBean
    private CoreServiceClient coreServiceClient;

    @BeforeEach
    void setUp() {
        ticketRepo.deleteAll();
        baseFareRepo.deleteAll();
        routeFareRepo.deleteAll();

        baseFareRepo.save(new BaseFare(2, 30.0, 50.0, 70.0, 90.0, 120.0));

        // id left null: the entity generates its own, and handing Hibernate one makes the row
        // look like a detached update of something that was never inserted.
        routeFareRepo.save(new RouteFare(null, ROUTE_ID, 1, "section-1", 0.0));
        routeFareRepo.save(new RouteFare(null, ROUTE_ID, 3, "section-3", 20.0));

        when(coreServiceClient.getBookingContext(anyString(), anyString(), anyString()))
                .thenReturn(bookableTrip("NORMAL"));
    }

    private BookingContext bookableTrip(String serviceClass) {
        LocalDateTime departure = LocalDateTime.now().plusHours(3);
        return new BookingContext(TRIP_ID, "pending", departure.toLocalDate(), departure.toLocalTime(),
                BUS_ID, 50, serviceClass, ROUTE_ID, 0.0, 20.0, 1, 5);
    }

    private String bookingBody(Map<String, Object> fields) throws Exception {
        return objectMapper.writeValueAsString(fields);
    }

    private Map<String, Object> baseBooking() {
        return new java.util.HashMap<>(Map.of(
                "tripId", TRIP_ID,
                "startLocationId", FROM_STOP,
                "endLocationId", TO_STOP,
                "seatNumbers", List.of("A1")));
    }

    @Test
    @DisplayName("INC-011: a booking is priced by the server, not by the amount the client sends")
    void bookingIgnoresClientSuppliedFare() throws Exception {
        Map<String, Object> body = baseBooking();
        body.put("fareAmount", new BigDecimal("1.00"));

        mockMvc.perform(post("/api/v1/tickets/book")
                        .header("x-user-id", PASSENGER)
                        .header("x-user-type", "passenger")
                        .contentType(APPLICATION_JSON)
                        .content(bookingBody(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.farePerSeat").value(NORMAL_FARE.doubleValue()))
                .andExpect(jsonPath("$.fareAmount").value(NORMAL_FARE.doubleValue()));

        assertThat(ticketRepo.findAll())
                .singleElement()
                .extracting(Tickets::getFareAmount)
                .satisfies(fare -> assertThat((BigDecimal) fare).isEqualByComparingTo(NORMAL_FARE));
    }

    @Test
    @DisplayName("INC-011: a booking belongs to the signed-in passenger, not the one in the body")
    void bookingIgnoresClientSuppliedPassenger() throws Exception {
        Map<String, Object> body = baseBooking();
        body.put("passengerId", OTHER_PASSENGER);

        mockMvc.perform(post("/api/v1/tickets/book")
                        .header("x-user-id", PASSENGER)
                        .header("x-user-type", "passenger")
                        .contentType(APPLICATION_JSON)
                        .content(bookingBody(body)))
                .andExpect(status().isCreated());

        assertThat(ticketRepo.findAll())
                .singleElement()
                .extracting(Tickets::getPassengerId)
                .isEqualTo(PASSENGER);
    }

    @Test
    @DisplayName("INC-011: booking without a signed-in caller is refused")
    void bookingRequiresIdentity() throws Exception {
        mockMvc.perform(post("/api/v1/tickets/book")
                        .contentType(APPLICATION_JSON)
                        .content(bookingBody(baseBooking())))
                .andExpect(status().isUnauthorized());

        assertThat(ticketRepo.findAll()).isEmpty();
    }

    @Test
    @DisplayName("INC-011: an air-conditioned bus prices at its own tier, not at an error string")
    void semiLuxuryJourneyIsPriced() throws Exception {
        when(coreServiceClient.getBookingContext(anyString(), anyString(), anyString()))
                .thenReturn(bookableTrip("SEMI_LUXURY"));

        mockMvc.perform(post("/api/v1/tickets/book")
                        .header("x-user-id", PASSENGER)
                        .header("x-user-type", "passenger")
                        .contentType(APPLICATION_JSON)
                        .content(bookingBody(baseBooking())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.farePerSeat").value(SEMI_LUXURY_FARE.doubleValue()));
    }

    @Test
    @DisplayName("INC-011: several seats book as one payment, and too many are refused")
    void multiSeatBooking() throws Exception {
        Map<String, Object> body = baseBooking();
        body.put("seatNumbers", List.of("A1", "A2", "A3"));

        mockMvc.perform(post("/api/v1/tickets/book")
                        .header("x-user-id", PASSENGER)
                        .header("x-user-type", "passenger")
                        .contentType(APPLICATION_JSON)
                        .content(bookingBody(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ticketIds.length()").value(3))
                .andExpect(jsonPath("$.fareAmount").value(NORMAL_FARE.multiply(BigDecimal.valueOf(3)).doubleValue()));

        List<Tickets> booked = ticketRepo.findAll();
        assertThat(booked).hasSize(3);
        assertThat(booked.stream().map(t -> t.getTransactions().getTransactionId()).distinct())
                .as("one payment for the whole booking")
                .hasSize(1);

        Map<String, Object> tooMany = baseBooking();
        tooMany.put("seatNumbers", List.of("B1", "B2", "B3", "B4", "B5", "B6"));
        mockMvc.perform(post("/api/v1/tickets/book")
                        .header("x-user-id", PASSENGER)
                        .header("x-user-type", "passenger")
                        .contentType(APPLICATION_JSON)
                        .content(bookingBody(tooMany)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("INC-011: a trip that cannot be booked is refused with a reason")
    void unbookableTripsAreRefused() throws Exception {
        LocalDateTime soon = LocalDateTime.now().plusMinutes(10);

        // Past the cutoff
        when(coreServiceClient.getBookingContext(anyString(), anyString(), anyString()))
                .thenReturn(new BookingContext(TRIP_ID, "pending", soon.toLocalDate(), soon.toLocalTime(),
                        BUS_ID, 50, "NORMAL", ROUTE_ID, 0.0, 20.0, 1, 5));
        expectBookingRefused();

        // Already departed
        LocalDateTime later = LocalDateTime.now().plusHours(3);
        when(coreServiceClient.getBookingContext(anyString(), anyString(), anyString()))
                .thenReturn(new BookingContext(TRIP_ID, "departed", later.toLocalDate(), later.toLocalTime(),
                        BUS_ID, 50, "NORMAL", ROUTE_ID, 0.0, 20.0, 1, 5));
        expectBookingRefused();

        // No bus assigned, so there is no seat map to sell against
        when(coreServiceClient.getBookingContext(anyString(), anyString(), anyString()))
                .thenReturn(new BookingContext(TRIP_ID, "pending", later.toLocalDate(), later.toLocalTime(),
                        null, null, null, ROUTE_ID, 0.0, 20.0, 1, 5));
        expectBookingRefused();

        assertThat(ticketRepo.findAll()).isEmpty();
    }

    private void expectBookingRefused() throws Exception {
        mockMvc.perform(post("/api/v1/tickets/book")
                        .header("x-user-id", PASSENGER)
                        .header("x-user-type", "passenger")
                        .contentType(APPLICATION_JSON)
                        .content(bookingBody(baseBooking())))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("INC-011: a passenger cannot read, pay for or cancel someone else's ticket")
    void otherPeoplesTicketsAreRefused() throws Exception {
        Long ticketId = bookOneSeatAs(PASSENGER);

        mockMvc.perform(get("/api/v1/tickets/{id}", ticketId)
                        .header("x-user-id", OTHER_PASSENGER)
                        .header("x-user-type", "passenger"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/tickets/passenger/{id}", PASSENGER)
                        .header("x-user-id", OTHER_PASSENGER)
                        .header("x-user-type", "passenger"))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/tickets/payment/{id}/confirm", ticketId)
                        .header("x-user-id", OTHER_PASSENGER)
                        .header("x-user-type", "passenger"))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/tickets/{id}/cancel", ticketId)
                        .header("x-user-id", OTHER_PASSENGER)
                        .header("x-user-type", "passenger")
                        .contentType(APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());

        assertThat(ticketRepo.findById(ticketId))
                .get()
                .extracting(Tickets::getStatus)
                .isEqualTo(Tickets.Status.NOT_VALID);
    }

    @Test
    @DisplayName("INC-011: the passenger who booked it, and staff, can still read a ticket")
    void ownerAndStaffCanRead() throws Exception {
        Long ticketId = bookOneSeatAs(PASSENGER);

        mockMvc.perform(get("/api/v1/tickets/{id}", ticketId)
                        .header("x-user-id", PASSENGER)
                        .header("x-user-type", "passenger"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.passengerId").value(PASSENGER));

        mockMvc.perform(get("/api/v1/tickets/passenger/{id}", PASSENGER)
                        .header("x-user-id", "some-mot-official")
                        .header("x-user-type", "mot"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    private Long bookOneSeatAs(String passengerId) throws Exception {
        String response = mockMvc.perform(post("/api/v1/tickets/book")
                        .header("x-user-id", passengerId)
                        .header("x-user-type", "passenger")
                        .contentType(APPLICATION_JSON)
                        .content(bookingBody(baseBooking())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("ticketId").asLong();
    }
}
