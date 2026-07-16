package com.busmatelk.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Verifies Google/Facebook ID tokens against each provider's own JWKS — no client secret needed,
 * since the mobile/SPA app already did the interactive OAuth dance and handed us the provider's
 * signed ID token. One {@link NimbusJwtDecoder} per provider, built lazily and cached, since
 * building one eagerly at startup would otherwise force a JWKS fetch before it's ever needed.
 */
@Component
public class JwtSocialIdentityVerifier implements SocialIdentityVerifier {

    private final Map<String, ProviderConfig> providers;
    private final Map<String, JwtDecoder> decoders = new ConcurrentHashMap<>();

    public JwtSocialIdentityVerifier(
            @Value("${auth.social.google.client-id:}") String googleClientId,
            @Value("${auth.social.google.issuer:https://accounts.google.com}") String googleIssuer,
            @Value("${auth.social.google.jwks-uri:https://www.googleapis.com/oauth2/v3/certs}") String googleJwksUri,
            @Value("${auth.social.facebook.client-id:}") String facebookClientId,
            @Value("${auth.social.facebook.issuer:https://www.facebook.com}") String facebookIssuer,
            @Value("${auth.social.facebook.jwks-uri:https://www.facebook.com/.well-known/oauth/openid/jwks/}") String facebookJwksUri) {
        this.providers = Map.of(
                "google", new ProviderConfig(googleClientId, googleIssuer, googleJwksUri),
                "facebook", new ProviderConfig(facebookClientId, facebookIssuer, facebookJwksUri));
    }

    @Override
    public VerifiedSocialIdentity verify(String provider, String idToken) {
        ProviderConfig config = providers.get(provider);
        if (config == null) {
            throw new InvalidTokenException("Unsupported social login provider: " + provider);
        }
        if (config.clientId().isBlank()) {
            throw new IllegalStateException(
                    "Social login provider '" + provider + "' has no client-id configured");
        }

        Jwt jwt;
        try {
            jwt = decoderFor(provider, config).decode(idToken);
        } catch (JwtException e) {
            throw new InvalidTokenException("Invalid " + provider + " ID token: " + e.getMessage());
        }

        String subject = jwt.getSubject();
        String email = jwt.getClaimAsString("email");
        if (subject == null || email == null) {
            throw new InvalidTokenException(provider + " ID token is missing the sub/email claims");
        }
        boolean emailVerified = Boolean.TRUE.equals(jwt.getClaimAsBoolean("email_verified"));
        return new VerifiedSocialIdentity(provider, subject, email, emailVerified);
    }

    private JwtDecoder decoderFor(String provider, ProviderConfig config) {
        return decoders.computeIfAbsent(provider, key -> {
            NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(config.jwksUri()).build();
            OAuth2TokenValidator<Jwt> validator = new DelegatingOAuth2TokenValidator<>(
                    JwtValidators.createDefault(),
                    new JwtClaimValidator<String>("iss", iss -> config.issuer().equals(iss)),
                    new JwtClaimValidator<List<String>>("aud", aud -> aud != null && aud.contains(config.clientId())));
            decoder.setJwtValidator(validator);
            return decoder;
        });
    }

    private record ProviderConfig(String clientId, String issuer, String jwksUri) {
    }
}
