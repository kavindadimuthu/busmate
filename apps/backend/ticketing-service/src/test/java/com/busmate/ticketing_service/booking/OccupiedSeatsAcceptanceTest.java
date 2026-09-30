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
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.empty;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * INC-068 acceptance criteria: a passenger choosing a seat can learn which seats are taken, and
 * nothing about who took them.
 *
 * <p>core-service is stubbed as in {@link SeatHoldIntegrityAcceptanceTest}; real Postgres and the
 * real controller are used.
 */
@SpringBootTest
@AutoConfigureMockMvc
class OccupiedSeatsAcceptanceTest extends AbstractPostgresIntegrationTest {

    private static final String TRIP_ID = "66666666-6666-6666-6666-666666666666";
    private static final String OTHER_TRIP_ID = "12121212-1212-1212-1212-121212121212";
    private static final String BUS_ID = "77777777-7777-7777-7777-777777777777";
    private static final String ROUTE_ID = "88888888-8888-8888-8888-888888888888";
    private static final String FROM_STOP = "99999999-9999-9999-9999-999999999999";
    private static final String TO_STOP = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

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
        routeFareRepo.save(new RouteFare(null, ROUTE_ID, 1, "section-1", 0.0));
        routeFareRepo.save(new RouteFare(null, ROUTE_ID, 3, "section-3", 20.0));

        LocalDateTime departure = LocalDateTime.now().plusHours(3);
        when(coreServiceClient.getBookingContext(anyString(), anyString(), anyString()))
                .thenAnswer(inv -> new BookingContext(inv.getArgument(0), "pending", departure.toLocalDate(),
                        departure.toLocalTime(), BUS_ID, 50, "NORMAL", ROUTE_ID, 0.0, 20.0, 1, 5, "operator-1"));
    }

    private ResultActions book(String tripId, String passengerId, String... seats) throws Exception {
        return mockMvc.perform(post("/api/v1/tickets/book")
                .header("x-user-id", passengerId)
                .header("x-user-type", "passenger")
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                        "tripId", tripId,
                        "startLocationId", FROM_STOP,
                        "endLocationId", TO_STOP,
                        "seatNumbers", List.of(seats)))));
    }

    private ResultActions occupied(String tripId) throws Exception {
        return mockMvc.perform(get("/api/v1/tickets/trip/" + tripId + "/occupied-seats")
                .header("x-user-id", "some-other-passenger")
                .header("x-user-type", "passenger"));
    }

    @Test
    @DisplayName("INC-068: seats booked by other passengers are listed, sorted, for this trip only")
    void bookedSeatsAreListed() throws Exception {
        book(TRIP_ID, "alice", "B2", "A1").andExpect(status().isCreated());
        book(TRIP_ID, "bob", "A3").andExpect(status().isCreated());
        book(OTHER_TRIP_ID, "carol", "C9").andExpect(status().isCreated());

        occupied(TRIP_ID)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tripId").value(TRIP_ID))
                .andExpect(jsonPath("$.occupiedSeats", contains("A1", "A3", "B2")));
    }

    @Test
    @DisplayName("INC-068: a cancelled seat is free again")
    void cancelledSeatIsNotListed() throws Exception {
        book(TRIP_ID, "alice", "A1", "A2").andExpect(status().isCreated());
        Tickets cancelled = ticketRepo.findByTripId(TRIP_ID).stream()
                .filter(t -> "A1".equals(t.getSeatNumber())).findFirst().orElseThrow();
        cancelled.setStatus(Tickets.Status.CANCELLED);
        ticketRepo.save(cancelled);

        occupied(TRIP_ID).andExpect(jsonPath("$.occupiedSeats", contains("A2")));
    }

    @Test
    @DisplayName("INC-068: a trip nothing has been sold on has no occupied seats, not an error")
    void emptyTripIsNotAnError() throws Exception {
        occupied(TRIP_ID)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.occupiedSeats", empty()));
    }

    @Test
    @DisplayName("INC-068: the response carries seat labels only, nothing about tickets, people or money")
    void responseIsSeatLabelsOnly() throws Exception {
        book(TRIP_ID, "alice", "A1").andExpect(status().isCreated());

        String body = occupied(TRIP_ID).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();

        assertThat(objectMapper.readTree(body).fieldNames()).toIterable().containsExactlyInAnyOrder("tripId", "occupiedSeats");
        assertThat(body).doesNotContain("alice").doesNotContain("passenger").doesNotContain("fare").doesNotContain("ticketId");
    }
}
