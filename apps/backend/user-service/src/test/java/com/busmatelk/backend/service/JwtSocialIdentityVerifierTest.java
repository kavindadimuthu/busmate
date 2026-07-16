package com.busmatelk.backend.service;

import com.sun.net.httpserver.HttpServer;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.io.OutputStream;
import java.math.BigInteger;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.Arrays;
import java.util.Base64;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Exercises {@link JwtSocialIdentityVerifier} against a real (local, in-process) JWKS endpoint —
 * NimbusJwtDecoder's remote-JWKS fetcher genuinely dials it over HTTP, so a mocked HTTP client
 * wouldn't prove anything (same lesson as the gateway's jose-v4 JWKS tests in Phase 2b).
 */
class JwtSocialIdentityVerifierTest {

    private static final String KID = "test-key-1";
    private static final String GOOGLE_CLIENT_ID = "test-google-client-id";
    private static final String GOOGLE_ISSUER = "https://accounts.google.com";

    private static KeyPair keyPair;
    private static HttpServer server;
    private static String jwksUri;

    @BeforeAll
    static void startJwksServer() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        keyPair = generator.generateKeyPair();

        String jwksJson = buildJwksJson((RSAPublicKey) keyPair.getPublic());

        server = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
        server.createContext("/jwks.json", exchange -> {
            byte[] body = jwksJson.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, body.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(body);
            }
        });
        server.start();
        jwksUri = "http://localhost:" + server.getAddress().getPort() + "/jwks.json";
    }

    @AfterAll
    static void stopJwksServer() {
        server.stop(0);
    }

    @Test
    void acceptsAValidGoogleIdTokenAndExtractsTheIdentity() {
        JwtSocialIdentityVerifier verifier = googleOnlyVerifier();
        String token = signToken(GOOGLE_ISSUER, GOOGLE_CLIENT_ID, "google-subject-1",
                "rider@example.com", true, Instant.now().plusSeconds(3600));

        VerifiedSocialIdentity identity = verifier.verify("google", token);

        assertThat(identity.provider()).isEqualTo("google");
        assertThat(identity.subject()).isEqualTo("google-subject-1");
        assertThat(identity.email()).isEqualTo("rider@example.com");
        assertThat(identity.emailVerified()).isTrue();
    }

    @Test
    void rejectsATokenSignedForADifferentAudience() {
        JwtSocialIdentityVerifier verifier = googleOnlyVerifier();
        String token = signToken(GOOGLE_ISSUER, "some-other-client-id", "google-subject-1",
                "rider@example.com", true, Instant.now().plusSeconds(3600));

        assertThatThrownBy(() -> verifier.verify("google", token))
                .isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void rejectsATokenFromAnUnexpectedIssuer() {
        JwtSocialIdentityVerifier verifier = googleOnlyVerifier();
        String token = signToken("https://evil.example.com", GOOGLE_CLIENT_ID, "google-subject-1",
                "rider@example.com", true, Instant.now().plusSeconds(3600));

        assertThatThrownBy(() -> verifier.verify("google", token))
                .isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void rejectsAnExpiredToken() {
        JwtSocialIdentityVerifier verifier = googleOnlyVerifier();
        String token = signToken(GOOGLE_ISSUER, GOOGLE_CLIENT_ID, "google-subject-1",
                "rider@example.com", true, Instant.now().minusSeconds(60));

        assertThatThrownBy(() -> verifier.verify("google", token))
                .isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void rejectsAnUnsupportedProvider() {
        JwtSocialIdentityVerifier verifier = googleOnlyVerifier();

        assertThatThrownBy(() -> verifier.verify("twitter", "irrelevant"))
                .isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void rejectsAProviderWithNoClientIdConfigured() {
        JwtSocialIdentityVerifier verifier = new JwtSocialIdentityVerifier(
                GOOGLE_CLIENT_ID, GOOGLE_ISSUER, jwksUri,
                "", "https://www.facebook.com", "https://www.facebook.com/.well-known/oauth/openid/jwks/");
        String token = signToken("https://www.facebook.com", "irrelevant", "facebook-subject-1",
                "rider@example.com", true, Instant.now().plusSeconds(3600));

        assertThatThrownBy(() -> verifier.verify("facebook", token))
                .isInstanceOf(IllegalStateException.class);
    }

    private static JwtSocialIdentityVerifier googleOnlyVerifier() {
        return new JwtSocialIdentityVerifier(
                GOOGLE_CLIENT_ID, GOOGLE_ISSUER, jwksUri,
                "", "https://www.facebook.com", "https://www.facebook.com/.well-known/oauth/openid/jwks/");
    }

    private static String signToken(String issuer, String audience, String subject, String email,
                                     boolean emailVerified, Instant expiry) {
        return Jwts.builder()
                .setHeaderParam("kid", KID)
                .setIssuer(issuer)
                .setAudience(audience)
                .setSubject(subject)
                .claim("email", email)
                .claim("email_verified", emailVerified)
                .setExpiration(Date.from(expiry))
                .signWith((RSAPrivateKey) keyPair.getPrivate(), SignatureAlgorithm.RS256)
                .compact();
    }

    private static String buildJwksJson(RSAPublicKey publicKey) {
        String n = base64Url(publicKey.getModulus());
        String e = base64Url(publicKey.getPublicExponent());
        return """
                {"keys":[{"kty":"RSA","use":"sig","alg":"RS256","kid":"%s","n":"%s","e":"%s"}]}
                """.formatted(KID, n, e);
    }

    /** JWK requires unsigned, big-endian integers — strip the sign byte BigInteger prepends. */
    private static String base64Url(BigInteger value) {
        byte[] bytes = value.toByteArray();
        if (bytes.length > 1 && bytes[0] == 0) {
            bytes = Arrays.copyOfRange(bytes, 1, bytes.length);
        }
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
