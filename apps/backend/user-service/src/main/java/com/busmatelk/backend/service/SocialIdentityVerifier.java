package com.busmatelk.backend.service;

/**
 * Verifies a social login provider's ID token and returns the identity it asserts. Implementations
 * must check signature, issuer, audience, and expiry — nothing downstream re-validates the token.
 */
public interface SocialIdentityVerifier {

    /**
     * @throws InvalidTokenException if {@code provider} is unsupported or {@code idToken} fails
     *                                signature/issuer/audience/expiry checks
     */
    VerifiedSocialIdentity verify(String provider, String idToken);
}
