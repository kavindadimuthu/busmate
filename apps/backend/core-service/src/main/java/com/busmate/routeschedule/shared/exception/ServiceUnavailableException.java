package com.busmate.routeschedule.shared.exception;

/** A service this request depends on could not be reached (503); the request is refused, not guessed. */
public class ServiceUnavailableException extends RuntimeException {
    public ServiceUnavailableException(String message) {
        super(message);
    }
}
