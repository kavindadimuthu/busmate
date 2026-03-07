package com.busmate.routeschedule.shared.security;

import java.io.IOException;
import java.net.URL;
import java.text.ParseException;
import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.crypto.RSASSAVerifier;
import com.nimbusds.jose.jwk.JWK;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jwt.SignedJWT;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
@Qualifier("jwtAuthenticationFilter")
@Profile("!dev")
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Value("${asgardeo.jwks-url}")
    private String jwksUrl;

    // Cache the JWKS to avoid fetching on every request
    private volatile JWKSet cachedJwkSet;
    private volatile long jwkSetLastFetched;
    private static final long JWKS_CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);

        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            JWSAlgorithm alg = signedJWT.getHeader().getAlgorithm();

            if (!JWSAlgorithm.RS256.equals(alg)) {
                throw new SecurityException("Unsupported JWT algorithm: " + alg + ". Only RS256 is accepted.");
            }

            JWKSet jwkSet = getJwkSet();
            String keyId = signedJWT.getHeader().getKeyID();
            JWK jwk = jwkSet.getKeyByKeyId(keyId);

            if (jwk == null) {
                // Key might have rotated; force refresh and retry
                jwkSet = refreshJwkSet();
                jwk = jwkSet.getKeyByKeyId(keyId);
                if (jwk == null) {
                    throw new SecurityException("No matching key found in JWKS for kid: " + keyId);
                }
            }

            RSAKey rsaKey = (RSAKey) jwk;
            boolean signatureValid = signedJWT.verify(new RSASSAVerifier(rsaKey));

            if (!signatureValid) {
                throw new SecurityException("Invalid JWT signature");
            }

            var claims = signedJWT.getJWTClaimsSet();

            if (claims.getExpirationTime() == null || new Date().after(claims.getExpirationTime())) {
                throw new SecurityException("Token expired");
            }

            // Extract Asgardeo claims
            String subject = claims.getSubject();
            String email = claims.getStringClaim("email");
            List<String> groups = claims.getStringListClaim("groups");

            String username = email != null ? email : subject;

            // Build roles from groups claim
            StringBuilder roles = new StringBuilder();
            if (groups != null && !groups.isEmpty()) {
                for (int i = 0; i < groups.size(); i++) {
                    if (i > 0) roles.append(",");
                    roles.append("ROLE_").append(groups.get(i).toUpperCase());
                }
            } else {
                roles.append("ROLE_USER");
            }

            if (username != null) {
                var userDetails = new UserPrincipal(username, roles.toString());
                var auth = new UsernamePasswordAuthenticationToken(userDetails, null,
                        userDetails.getAuthorities());
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }

        } catch (ParseException | JOSEException | SecurityException e) {
            logger.error("JWT validation failed: " + e.getMessage(), e);
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    private JWKSet getJwkSet() throws IOException, ParseException {
        long now = System.currentTimeMillis();
        if (cachedJwkSet != null && (now - jwkSetLastFetched) < JWKS_CACHE_DURATION_MS) {
            return cachedJwkSet;
        }
        return refreshJwkSet();
    }

    private synchronized JWKSet refreshJwkSet() throws IOException, ParseException {
        long now = System.currentTimeMillis();
        // Double-check after acquiring lock
        if (cachedJwkSet != null && (now - jwkSetLastFetched) < JWKS_CACHE_DURATION_MS) {
            return cachedJwkSet;
        }
        cachedJwkSet = JWKSet.load(new URL(jwksUrl));
        jwkSetLastFetched = now;
        return cachedJwkSet;
    }
}
