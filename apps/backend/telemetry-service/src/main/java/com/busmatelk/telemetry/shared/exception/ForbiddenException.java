package com.busmatelk.telemetry.shared.exception;

/** The caller is known but not entitled to this. */
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}
