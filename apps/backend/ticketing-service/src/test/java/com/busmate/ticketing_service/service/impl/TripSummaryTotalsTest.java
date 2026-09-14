package com.busmate.ticketing_service.service.impl;

import com.busmate.ticketing_service.dto.response.PaymentBreakdownEntryDTO;
import com.busmate.ticketing_service.dto.response.TripSummaryDTO;
import com.busmate.ticketing_service.entity.Cash;
import com.busmate.ticketing_service.entity.Online;
import com.busmate.ticketing_service.entity.Tickets;
import com.busmate.ticketing_service.entity.Transactions;
import com.busmate.ticketing_service.repository.TicketRepo;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TripSummaryTotalsTest {

    private static final String TRIP = "trip-1";

    @Mock
    private TicketRepo ticketRepo;

    @InjectMocks
    private PaymentServiceIMPL service;

    @Test
    void inc009_cancelledFaresAreExcludedSoTotalRevenueEqualsItsBreakdown() {
        // The completed demo trip that exposed this: two cash, one online booking, and one online
        // booking cancelled and refunded. Total revenue read Rs 480 while its rows summed to 360.
        when(ticketRepo.findByTripId(TRIP)).thenReturn(List.of(
                cashTicket("120", Tickets.Status.VALID),
                onlineTicket("120", Tickets.Status.NOT_VALID),
                onlineTicket("120", Tickets.Status.CANCELLED),
                cashTicket("120", Tickets.Status.VALID)));

        TripSummaryDTO summary = service.getTripSummary(TRIP);

        assertMoney("360", summary.getTotalFareAmount());
        assertMoney("360", sum(summary.getPaymentBreakdown()));
        assertEquals(3, summary.getTotalTickets());
        assertEquals(2, summary.getValidTickets());
        assertEquals(1, summary.getInvalidTickets(), "sold but not yet boarded - not the cancelled one");
        assertEquals(1, summary.getCancelledTickets());
        assertMoney("120", summary.getAverageFarePerTicket());
    }

    @Test
    void inc009_aTripWhoseOnlyTicketWasCancelledEarnsNothing() {
        when(ticketRepo.findByTripId(TRIP)).thenReturn(List.of(
                onlineTicket("120", Tickets.Status.CANCELLED)));

        TripSummaryDTO summary = service.getTripSummary(TRIP);

        assertMoney("0", summary.getTotalFareAmount());
        assertEquals(0, summary.getTotalTickets());
        assertEquals(1, summary.getCancelledTickets());
        assertMoney("0", summary.getAverageFarePerTicket());
        assertEquals(0, summary.getPaymentBreakdown().size());
    }

    private static Tickets cashTicket(String fare, Tickets.Status status) {
        Transactions transaction = new Transactions();
        transaction.setCash(new Cash());
        return ticket(fare, status, Tickets.IssueMethod.CONDUCTOR, transaction);
    }

    private static Tickets onlineTicket(String fare, Tickets.Status status) {
        Online online = new Online();
        online.setMethod(Online.Method.PAYHERE);
        Transactions transaction = new Transactions();
        transaction.setOnline(online);
        return ticket(fare, status, Tickets.IssueMethod.ONLINE, transaction);
    }

    private static Tickets ticket(String fare, Tickets.Status status, Tickets.IssueMethod issueMethod,
            Transactions transaction) {
        Tickets ticket = new Tickets();
        ticket.setTripId(TRIP);
        ticket.setFareAmount(new BigDecimal(fare));
        ticket.setStatus(status);
        ticket.setIssueMethod(issueMethod);
        ticket.setTransactions(transaction);
        return ticket;
    }

    private static BigDecimal sum(List<PaymentBreakdownEntryDTO> breakdown) {
        return breakdown.stream().map(PaymentBreakdownEntryDTO::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static void assertMoney(String expected, BigDecimal actual) {
        assertEquals(0, new BigDecimal(expected).compareTo(actual),
                () -> "expected Rs " + expected + " but was Rs " + actual);
    }
}
