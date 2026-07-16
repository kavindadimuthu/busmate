package com.busmatelk.backend.controller;

import com.busmatelk.backend.client.SupabaseAuthException;
import com.busmatelk.backend.service.EmailAlreadyExistsException;
import com.busmatelk.backend.service.InvalidTokenException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;
import java.util.NoSuchElementException;

/**
 * Handles AccessDeniedException explicitly (rather than relying on Spring Security's
 * ExceptionTranslationFilter) because the catch-all Exception handler below would otherwise
 * swallow it first — @ExceptionHandler resolution happens inside DispatcherServlet.doDispatch(),
 * so if a generic Exception handler matched first, AccessDeniedException would never propagate
 * back out to the security filter chain at all.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(NoSuchElementException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(InvalidTokenException.class)
    public ResponseEntity<Map<String, String>> handleInvalidToken(InvalidTokenException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
    }

    // Local email/password auth failure — the in-house equivalent of GoTrue's invalid_credentials.
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleBadCredentials(BadCredentialsException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
    }

    // Login/refresh blocked because the account is suspended/deactivated/deleted.
    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<Map<String, String>> handleDisabled(DisabledException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<Map<String, String>> handleEmailExists(EmailAlreadyExistsException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDenied(AccessDeniedException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
    }

    // Known GoTrue error_codes mapped to the status a client should actually see (e.g. a
    // duplicate signup is a 409, not a 500). Not exhaustive by design — see the fallback in
    // handleSupabaseAuthException below for anything not listed here.
    private static final Map<String, HttpStatus> SUPABASE_ERROR_STATUS = Map.ofEntries(
            Map.entry("user_already_exists", HttpStatus.CONFLICT),
            Map.entry("email_exists", HttpStatus.CONFLICT),
            Map.entry("invalid_credentials", HttpStatus.UNAUTHORIZED),
            Map.entry("email_not_confirmed", HttpStatus.FORBIDDEN),
            Map.entry("user_banned", HttpStatus.FORBIDDEN),
            Map.entry("signup_disabled", HttpStatus.FORBIDDEN),
            Map.entry("weak_password", HttpStatus.BAD_REQUEST),
            Map.entry("same_password", HttpStatus.BAD_REQUEST),
            Map.entry("validation_failed", HttpStatus.BAD_REQUEST),
            Map.entry("refresh_token_not_found", HttpStatus.UNAUTHORIZED),
            Map.entry("refresh_token_already_used", HttpStatus.UNAUTHORIZED),
            Map.entry("session_not_found", HttpStatus.UNAUTHORIZED),
            Map.entry("over_email_send_rate_limit", HttpStatus.TOO_MANY_REQUESTS),
            Map.entry("over_request_rate_limit", HttpStatus.TOO_MANY_REQUESTS));

    /**
     * An error_code in the table above wins. Otherwise, Supabase's own status is trustworthy
     * for the 4xx/5xx split — GoTrue returning 4xx is invariably the caller's fault (bad
     * input/credentials) even for an error_code this service doesn't recognize by name yet,
     * so pass it through unchanged rather than guessing. Only Supabase's own 5xx, or a
     * response whose body didn't even parse, falls back to 502 — signaling that the failure
     * is upstream (Supabase), not this service.
     */
    @ExceptionHandler(SupabaseAuthException.class)
    public ResponseEntity<Map<String, String>> handleSupabaseAuthException(SupabaseAuthException e) {
        HttpStatus status = e.getErrorCode() != null ? SUPABASE_ERROR_STATUS.get(e.getErrorCode()) : null;
        if (status == null) {
            status = e.getStatusCode().is4xxClientError()
                    ? HttpStatus.valueOf(e.getStatusCode().value())
                    : HttpStatus.BAD_GATEWAY;
        }
        String message = e.getSupabaseMessage() != null ? e.getSupabaseMessage() : "Authentication request failed";
        log.warn("Supabase auth error [{}]: {}", e.getErrorCode(), message);
        return ResponseEntity.status(status).body(Map.of("error", message));
    }

    /**
     * Without this, any other uncaught exception (e.g. a failed downstream Supabase call)
     * falls through to a container-level /error forward, which Spring Security then rejects
     * with a misleading, bodyless 403 instead of the real 500 — confirmed empirically while
     * verifying this phase's full application startup, testing a login with wrong credentials.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleUnexpected(Exception e) {
        log.error("Unhandled exception", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Internal server error"));
    }
}
