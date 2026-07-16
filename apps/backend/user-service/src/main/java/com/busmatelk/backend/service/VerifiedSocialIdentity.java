package com.busmatelk.backend.service;

/**
 * A provider identity that has already been cryptographically verified — the caller can trust
 * {@code subject}/{@code email} without re-checking the token itself.
 */
public record VerifiedSocialIdentity(String provider, String subject, String email, boolean emailVerified) {
}
