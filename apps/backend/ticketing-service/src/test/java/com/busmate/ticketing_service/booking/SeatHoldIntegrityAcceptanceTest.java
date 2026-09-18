package com.busmate.ticketing_service.booking;

import com.busmate.ticketing_service.AbstractPostgresIntegrationTest;
import com.busmate.ticketing_service.core.BookingContext;
import com.busmate.ticketing_service.core.CoreServiceClient;
import com.busmate.ticketing_service.entity.BaseFare;
import com.busmate.ticketing_service.entity.RouteFare;
import com.busmate.ticketing_service.entity.Tickets;
import com.busmate.ticketing_service.entity.Transactions;
import com.busmate.ticketing_service.repository.BaseFareRepo;
import com.busmate.ticketing_service.repository.RouteFareRepo;
import com.busmate.ticketing_service.repository.TicketRepo;
import com.busmate.ticketing_service.repository.TransactionsRepo;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * INC-012 acceptance criteria: a booked, cancelled or expired seat means what it says.
 *
 * <p>core-service is stubbed for the same reason as {@link PassengerBookingAcceptanceTest}; real
 * Postgres and the real controller are what matter here, since the actual guarantee under test is
 * a database constraint, not application logic.
 */
@SpringBootTest
@AutoConfigureMockMvc
class SeatHoldIntegrityAcceptanceTest extends AbstractPostgresIntegrationTest {

    private static final String TRIP_ID = "66666666-6666-6666-6666-666666666666";
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
    private TransactionsRepo transactionsRepo;
    @Autowired
    private BaseFareRepo baseFareRepo;
    @Autowired
    private RouteFareRepo routeFareRepo;

    @MockitoBean
    private CoreServiceClient coreServiceClient;

    @Autowired
    private com.busmate.ticketing_service.service.SeatHoldService seatHoldService;

    @BeforeEach
    void setUp() {
        ticketRepo.deleteAll();
        baseFareRepo.deleteAll();
        routeFareRepo.deleteAll();

        baseFareRepo.save(new BaseFare(2, 30.0, 50.0, 70.0, 90.0, 120.0));
        routeFareRepo.save(new RouteFare(null, ROUTE_ID, 1, "section-1", 0.0));
        routeFareRepo.save(new RouteFare(null, ROUTE_ID, 3, "section-3", 20.0));

        when(coreServiceClient.getBookingContext(anyString(), anyString(), anyString()))
                .thenReturn(bookableTrip());
    }

    private BookingContext bookableTrip() {
        LocalDateTime departure = LocalDateTime.now().plusHours(3);
        return new BookingContext(TRIP_ID, "pending", departure.toLocalDate(), departure.toLocalTime(),
                BUS_ID, 50, "NORMAL", ROUTE_ID, 0.0, 20.0, 1, 5);
    }

    private Map<String, Object> bookingFor(String... seats) {
        return new java.util.HashMap<>(Map.of(
                "tripId", TRIP_ID,
                "startLocationId", FROM_STOP,
                "endLocationId", TO_STOP,
                "seatNumbers", List.of(seats)));
    }

    private org.springframework.test.web.servlet.ResultActions book(String passengerId, Map<String, Object> body)
            throws Exception {
        return mockMvc.perform(post("/api/v1/tickets/book")
                .header("x-user-id", passengerId)
                .header("x-user-type", "passenger")
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)));
    }

    @Test
    @DisplayName("INC-012: a second booking for an already-held seat is refused")
    void seatAlreadyHeldIsRefused() throws Exception {
        book("alice", bookingFor("A1")).andExpect(status().isCreated());

        book("bob", bookingFor("A1"))
                .andExpect(status().isBadRequest());

        assertThat(ticketRepo.findAll()).hasSize(1);
    }

    @Test
    @DisplayName("INC-012: an expired hold no longer blocks the seat")
    void expiredHoldFreesTheSeat() throws Exception {
        book("alice", bookingFor("A1")).andExpect(status().isCreated());

        Tickets held = ticketRepo.findAll().get(0);
        held.setHoldExpiresAt(LocalDateTime.now().minusMinutes(1));
        ticketRepo.save(held);

        book("bob", bookingFor("A1")).andExpect(status().isCreated());

        List<Tickets> all = ticketRepo.findAll();
        assertThat(all).hasSize(2);
        assertThat(all).filteredOn(t -> t.getPassengerId().equals("alice"))
                .singleElement()
                .extracting(Tickets::getStatus)
                .isEqualTo(Tickets.Status.CANCELLED);
        assertThat(all).filteredOn(t -> t.getPassengerId().equals("bob"))
                .singleElement()
                .extracting(Tickets::getStatus)
                .isEqualTo(Tickets.Status.NOT_VALID);
    }

    @Test
    @DisplayName("INC-012: confirming payment on an expired hold is refused, not silently accepted")
    void confirmingAnExpiredHoldIsRefused() throws Exception {
        String response = book("alice", bookingFor("A1"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long ticketId = objectMapper.readTree(response).get("ticketId").asLong();

        Tickets held = ticketRepo.findById(ticketId).orElseThrow();
        held.setHoldExpiresAt(LocalDateTime.now().minusMinutes(1));
        ticketRepo.save(held);

        mockMvc.perform(post("/api/v1/tickets/payment/{id}/confirm", ticketId)
                        .header("x-user-id", "alice")
                        .header("x-user-type", "passenger"))
                .andExpect(status().isBadRequest());

        assertThat(ticketRepo.findById(ticketId)).get()
                .extracting(Tickets::getStatus)
                .isEqualTo(Tickets.Status.CANCELLED);
    }

    @Test
    @DisplayName("INC-012: a multi-seat booking with one unavailable seat creates nothing")
    void partiallyUnavailableMultiSeatBookingCreatesNothing() throws Exception {
        book("alice", bookingFor("B2")).andExpect(status().isCreated());

        book("bob", bookingFor("B1", "B2", "B3"))
                .andExpect(status().isBadRequest());

        List<Tickets> all = ticketRepo.findAll();
        assertThat(all).hasSize(1);
        assertThat(all.get(0).getPassengerId()).isEqualTo("alice");
        assertThat(all.get(0).getSeatNumber()).isEqualTo("B2");
    }

    @Test
    @DisplayName("INC-012: the scheduled sweep frees an expired hold on its own")
    void sweepFreesExpiredHoldIndependently() throws Exception {
        book("alice", bookingFor("A1")).andExpect(status().isCreated());
        Tickets held = ticketRepo.findAll().get(0);
        held.setHoldExpiresAt(LocalDateTime.now().minusMinutes(1));
        ticketRepo.save(held);

        // Nobody books A1 again - the sweep alone must free it and correct the payment record.
        seatHoldService.expireAllStaleHolds();

        Tickets swept = ticketRepo.findById(held.getTicketId()).orElseThrow();
        assertThat(swept.getStatus()).isEqualTo(Tickets.Status.CANCELLED);
        Transactions transaction = transactionsRepo.findById(swept.getTransactions().getTransactionId()).orElseThrow();
        assertThat(transaction.getStatus()).isEqualTo(Transactions.Status.FAILED);
    }

    @Test
    @DisplayName("INC-012: a real concurrent race for the same seat lets exactly one booking through")
    void concurrentBookingsForTheSameSeatOnlyOneWins() throws Exception {
        int attempts = 8;
        ExecutorService pool = Executors.newFixedThreadPool(attempts);
        CountDownLatch ready = new CountDownLatch(attempts);
        CountDownLatch go = new CountDownLatch(1);
        AtomicInteger created = new AtomicInteger();
        AtomicInteger refused = new AtomicInteger();

        for (int i = 0; i < attempts; i++) {
            String passenger = "racer-" + i;
            pool.submit(() -> {
                try {
                    ready.countDown();
                    go.await();
                    int status = book(passenger, bookingFor("C1")).andReturn().getResponse().getStatus();
                    if (status == 201) {
                        created.incrementAndGet();
                    } else {
                        refused.incrementAndGet();
                    }
                } catch (Exception e) {
                    refused.incrementAndGet();
                }
            });
        }

        ready.await(5, TimeUnit.SECONDS);
        go.countDown();
        pool.shutdown();
        pool.awaitTermination(20, TimeUnit.SECONDS);

        assertThat(created.get()).as("exactly one of %d simultaneous requests for the same seat", attempts).isEqualTo(1);
        assertThat(refused.get()).isEqualTo(attempts - 1);

        List<Tickets> tickets = ticketRepo.findAll();
        assertThat(tickets).filteredOn(t -> "C1".equals(t.getSeatNumber())).hasSize(1);
    }
}
