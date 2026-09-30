package com.busmate.ticketing_service.booking;

import com.busmate.ticketing_service.exception.BookingClosedException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;

/**
 * Whether passengers may book seats online (INC-072, ADR-031).
 *
 * <p>Closed unless switched on, so a deployment that forgets to set it can't sell anything. This is the
 * guard that matters: hiding a button in a client doesn't stop anyone calling the endpoint.
 *
 * <p>The dummy payment gateway confirms every payment without taking any money (ADR-014). In production that
 * would hand out tickets for free, so production refuses to start with booking open and real payments off,
 * rather than trusting that someone remembers.
 */
@Component
public class BookingSwitch {

    private final boolean open;

    public BookingSwitch(
            @Value("${booking.online-enabled:false}") boolean open,
            @Value("${payhere.checkout.enabled:false}") boolean realPaymentsOn,
            Environment environment) {
        if (open && !realPaymentsOn && environment.acceptsProfiles(Profiles.of("prod"))) {
            throw new IllegalStateException(
                    "Refusing to start: online booking is switched on in production while payments are the dummy "
                            + "gateway, which confirms every booking without taking money. Turn real payments on, or "
                            + "leave booking closed (booking.online-enabled=false).");
        }
        this.open = open;
    }

    public boolean isOpen() {
        return open;
    }

    /** Throws {@link BookingClosedException} unless booking is open. */
    public void requireOpen() {
        if (!open) {
            throw new BookingClosedException("Online booking isn't open yet.");
        }
    }
}
