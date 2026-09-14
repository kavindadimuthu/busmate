package com.busmate.ticketing_service.payment;

import com.busmate.ticketing_service.payment.PaymentMethod.Custody;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PaymentMethodTest {

    @Test
    void inc009_cashIsHeldByTheConductorAndDigitalMethodsAreSettled() {
        assertEquals(Custody.ON_HAND, PaymentMethod.custodyOf("CASH"));
        assertEquals(Custody.SETTLED, PaymentMethod.custodyOf("CARD"));
        assertEquals(Custody.SETTLED, PaymentMethod.custodyOf("PAYHERE"));
    }

    @Test
    void inc009_codesResolveCaseInsensitively() {
        assertEquals(Custody.SETTLED, PaymentMethod.custodyOf("card"));
    }

    @Test
    void inc009_anUnrecognisedMethodIsReportedUnknownRatherThanThrowing() {
        // A method added to the data ahead of this build must still be counted, not crash
        // a revenue report or disappear from a total.
        assertEquals(Custody.UNKNOWN, PaymentMethod.custodyOf("LANKAQR"));
        assertEquals(Custody.UNKNOWN, PaymentMethod.custodyOf(null));
        assertTrue(PaymentMethod.resolve("LANKAQR").isEmpty());
    }

    @Test
    void inc009_everyDeclaredMethodHasAConcreteCustody() {
        // Adding a constant without deciding who holds the money would silently put its revenue
        // in the unclassified bucket; UNKNOWN is only for codes this build has never seen.
        for (PaymentMethod method : PaymentMethod.values()) {
            assertTrue(method.getCustody() != Custody.UNKNOWN,
                    method + " must be classified ON_HAND or SETTLED");
        }
    }
}
