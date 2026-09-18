package com.busmate.routeschedule.shared.exception;

/** The request carries no usable identity (401). */
public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String message) {
        super(message);
    }
}
