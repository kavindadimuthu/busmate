package com.busmate.ticketing_service.booking;

import com.busmate.ticketing_service.AbstractPostgresIntegrationTest;
import com.busmate.ticketing_service.core.CoreServiceClient;
import com.busmate.ticketing_service.repository.TicketRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** INC-072 acceptance criteria, with the switch off: nothing can be booked, and everyone can be told so. */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "booking.online-enabled=false")
class BookingSwitchAcceptanceTest extends AbstractPostgresIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private TicketRepo ticketRepo;

    @MockitoBean
    private CoreServiceClient coreServiceClient;

    @BeforeEach
    void setUp() {
        ticketRepo.deleteAll();
    }

    @Test
    @DisplayName("INC-072: with booking closed, a booking is refused with 503 and its own code, and nothing is held or fetched")
    void closedBookingIsRefused() throws Exception {
        mockMvc.perform(post("/api/v1/tickets/book")
                        .header("x-user-id", "alice")
                        .header("x-user-type", "passenger")
                        .contentType(APPLICATION_JSON)
                        .content("{\"tripId\":\"66666666-6666-6666-6666-666666666666\",\"startLocationId\":\"a\",\"endLocationId\":\"b\",\"seatNumbers\":[\"A1\"]}"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("BOOKING_CLOSED"))
                .andExpect(jsonPath("$.message").value("Online booking isn't open yet."));

        assertThat(ticketRepo.findAll()).isEmpty();
        verifyNoInteractions(coreServiceClient);
    }

    @Test
    @DisplayName("INC-072: the status endpoint says booking is closed, to a caller with no identity at all")
    void statusSaysClosed() throws Exception {
        mockMvc.perform(get("/api/v1/tickets/booking-status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.onlineBookingOpen").value(false));
    }
}
