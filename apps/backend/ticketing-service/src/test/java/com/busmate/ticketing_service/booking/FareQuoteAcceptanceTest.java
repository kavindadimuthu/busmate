package com.busmate.ticketing_service.booking;

import com.busmate.ticketing_service.AbstractPostgresIntegrationTest;
import com.busmate.ticketing_service.core.BookingContext;
import com.busmate.ticketing_service.core.CoreServiceClient;
import com.busmate.ticketing_service.entity.BaseFare;
import com.busmate.ticketing_service.entity.RouteFare;
import com.busmate.ticketing_service.exception.BadRequestException;
import com.busmate.ticketing_service.repository.BaseFareRepo;
import com.busmate.ticketing_service.repository.RouteFareRepo;
import com.busmate.ticketing_service.repository.TicketRepo;
import com.fasterxml.jackson.databind.JsonNode;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * INC-073 acceptance criteria: a fare shown before booking is the fare booking then charges, and asking for one
 * changes nothing.
 *
 * <p>core-service is stubbed as in {@link SeatHoldIntegrityAcceptanceTest}; the fare tables and the pricing are real.
 */
@SpringBootTest
@AutoConfigureMockMvc
class FareQuoteAcceptanceTest extends AbstractPostgresIntegrationTest {

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
        when(coreServiceClient.getBookingContext(anyString(), anyString(), anyString())).thenReturn(context(0.0, 20.0));
    }

    private BookingContext context(Double from, Double to) {
        LocalDateTime departure = LocalDateTime.now().plusHours(3);
        return new BookingContext(TRIP_ID, "pending", departure.toLocalDate(), departure.toLocalTime(),
                BUS_ID, 50, "NORMAL", ROUTE_ID, from, to, 1, 5, "operator-1");
    }

    private JsonNode quote(int seats) throws Exception {
        String body = mockMvc.perform(get("/api/v1/tickets/quote")
                        .param("tripId", TRIP_ID).param("fromStopId", FROM_STOP).param("toStopId", TO_STOP)
                        .param("seats", String.valueOf(seats)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body);
    }

    @Test
    @DisplayName("INC-073: a quote is exactly what booking then charges, for one seat and for several")
    void quoteEqualsWhatBookingCharges() throws Exception {
        for (int seats : new int[] {1, 3}) {
            JsonNode q = quote(seats);
            String[] labels = {"A1", "A2", "A3"};
            String booked = mockMvc.perform(post("/api/v1/tickets/book")
                            .header("x-user-id", "alice-" + seats).header("x-user-type", "passenger")
                            .contentType(APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(Map.of(
                                    "tripId", TRIP_ID, "startLocationId", FROM_STOP, "endLocationId", TO_STOP,
                                    "seatNumbers", List.of(labels).subList(0, seats).stream().map(s -> s + "-" + seats).toList()))))
                    .andExpect(status().isCreated())
                    .andReturn().getResponse().getContentAsString();
            JsonNode b = objectMapper.readTree(booked);

            assertThat(q.get("farePerSeat").decimalValue()).isEqualByComparingTo(b.get("farePerSeat").decimalValue());
            assertThat(q.get("totalFare").decimalValue()).isEqualByComparingTo(b.get("fareAmount").decimalValue());
            assertThat(q.get("seatCount").asInt()).isEqualTo(seats);
        }
    }

    @Test
    @DisplayName("INC-073: the total is the per-seat fare times the seats, in rupees")
    void totalIsPerSeatTimesSeats() throws Exception {
        JsonNode one = quote(1);
        JsonNode four = quote(4);
        assertThat(four.get("totalFare").decimalValue())
                .isEqualByComparingTo(one.get("farePerSeat").decimalValue().multiply(BigDecimal.valueOf(4)));
        assertThat(four.get("currency").asText()).isEqualTo("LKR");
        assertThat(four.get("tripId").asText()).isEqualTo(TRIP_ID);
    }

    @Test
    @DisplayName("INC-073: asking for a quote is public, holds nothing and creates nothing")
    void quotingChangesNothingAndNeedsNoIdentity() throws Exception {
        quote(2); // no x-user headers at all
        assertThat(ticketRepo.findAll()).isEmpty();
    }

    @Test
    @DisplayName("INC-073: no seats, or more than one booking allows, is refused")
    void seatCountIsChecked() throws Exception {
        for (String seats : new String[] {"0", "-1", "6"}) {
            mockMvc.perform(get("/api/v1/tickets/quote")
                            .param("tripId", TRIP_ID).param("fromStopId", FROM_STOP).param("toStopId", TO_STOP)
                            .param("seats", seats))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("BAD_REQUEST"));
        }
    }

    @Test
    @DisplayName("INC-073: a journey that can't be priced is refused with a reason, never guessed")
    void unpriceableJourneyIsRefused() throws Exception {
        when(coreServiceClient.getBookingContext(anyString(), anyString(), anyString())).thenReturn(context(null, null));
        mockMvc.perform(get("/api/v1/tickets/quote")
                        .param("tripId", TRIP_ID).param("fromStopId", FROM_STOP).param("toStopId", TO_STOP))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("This route has no distances recorded, so a fare cannot be calculated"));

        when(coreServiceClient.getBookingContext(anyString(), anyString(), anyString()))
                .thenThrow(new BadRequestException("This journey cannot be priced: check the boarding and alighting stops"));
        mockMvc.perform(get("/api/v1/tickets/quote")
                        .param("tripId", TRIP_ID).param("fromStopId", FROM_STOP).param("toStopId", TO_STOP))
                .andExpect(status().isBadRequest());
    }
}
