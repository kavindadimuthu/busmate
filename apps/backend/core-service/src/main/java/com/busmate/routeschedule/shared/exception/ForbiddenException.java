package com.busmate.routeschedule.shared.exception;

/** The caller is authenticated but not allowed to act on this resource (403). */
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}
