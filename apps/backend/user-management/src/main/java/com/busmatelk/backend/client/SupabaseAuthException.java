package com.busmatelk.backend.client;

import org.springframework.http.HttpStatusCode;

/**
 * Carries a non-2xx Supabase Auth (GoTrue) response's real HTTP status and error_code/msg,
 * instead of collapsing every failure (duplicate signup, wrong password, rate limiting, ...)
 * into an opaque RuntimeException. GlobalExceptionHandler uses errorCode/statusCode to return
 * the right client-facing status instead of a blanket 500.
 */
public class SupabaseAuthException extends RuntimeException {

    private final HttpStatusCode statusCode;
    private final String errorCode;
    private final String supabaseMessage;

    public SupabaseAuthException(String message, HttpStatusCode statusCode, String errorCode,
                                  String supabaseMessage, Throwable cause) {
        super(message, cause);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.supabaseMessage = supabaseMessage;
    }

    public HttpStatusCode getStatusCode() {
        return statusCode;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public String getSupabaseMessage() {
        return supabaseMessage;
    }
}
