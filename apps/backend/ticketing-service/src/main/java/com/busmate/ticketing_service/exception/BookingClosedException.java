package com.busmate.ticketing_service.exception;

/** Online booking is switched off (INC-072). The passenger did nothing wrong and can't fix it, so this is a
 * 503 with its own code, not a 400: a client can tell "closed for now" from "your request was bad". */
public class BookingClosedException extends RuntimeException {
    public BookingClosedException(String message) {
        super(message);
    }
}
