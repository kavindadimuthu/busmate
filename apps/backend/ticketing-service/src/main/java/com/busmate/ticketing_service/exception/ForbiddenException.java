package com.busmate.ticketing_service.exception;

/** A known caller asking for something that is not theirs. */
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}
