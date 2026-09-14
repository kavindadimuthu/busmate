package com.busmate.ticketing_service.sales;

import com.busmate.ticketing_service.entity.Tickets;
import com.busmate.ticketing_service.sales.SaleChannel.SaleStage;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SaleChannelTest {

    @Test
    void inc010_conductorSalesAreOnTheBusAndOnlineSalesArePreBooked() {
        assertEquals(SaleStage.ON_BUS, SaleChannel.stageOf("CONDUCTOR"));
        assertEquals(SaleStage.PRE_BOOKED, SaleChannel.stageOf("ONLINE"));
        assertEquals(SaleStage.PRE_BOOKED, SaleChannel.stageOf("online"));
    }

    @Test
    void inc010_anUnrecognisedChannelIsReportedUnknownRatherThanThrowing() {
        assertEquals(SaleStage.UNKNOWN, SaleChannel.stageOf("COUNTER"));
        assertEquals(SaleStage.UNKNOWN, SaleChannel.stageOf(null));
    }

    @Test
    void inc010_everyDeclaredChannelHasAConcreteStage() {
        for (SaleChannel channel : SaleChannel.values()) {
            assertTrue(channel.getStage() != SaleStage.UNKNOWN,
                    channel + " must be classified ON_BUS or PRE_BOOKED");
        }
    }

    @Test
    void inc010_everyStoredIssueMethodIsAKnownChannel() {
        // Channel codes are the stored issue-method values. A value added to the column without a
        // channel would put real tickets in the UNKNOWN bucket on every screen.
        for (Tickets.IssueMethod method : Tickets.IssueMethod.values()) {
            assertTrue(SaleChannel.resolve(method.name()).isPresent(),
                    "Tickets.IssueMethod." + method + " has no SaleChannel");
        }
    }
}
