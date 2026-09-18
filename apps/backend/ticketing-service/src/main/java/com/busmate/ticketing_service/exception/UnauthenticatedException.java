package com.busmate.ticketing_service.exception;

/** No identity reached this service — the caller did not come through the gateway signed in. */
public class UnauthenticatedException extends RuntimeException {
    public UnauthenticatedException(String message) {
        super(message);
    }
}
