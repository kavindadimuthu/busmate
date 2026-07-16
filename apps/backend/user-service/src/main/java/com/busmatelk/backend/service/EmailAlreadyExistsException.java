package com.busmatelk.backend.service;

/**
 * Raised when registration/creation targets an email that already has an account. Mapped to a
 * 409 by GlobalExceptionHandler — the local equivalent of GoTrue's {@code email_exists}.
 */
public class EmailAlreadyExistsException extends RuntimeException {
    public EmailAlreadyExistsException(String message) {
        super(message);
    }
}
