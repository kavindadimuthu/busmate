package com.busmate.routeschedule.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSObject;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jose.crypto.RSASSAVerifier;
import com.nimbusds.jose.jwk.JWK;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jwt.SignedJWT;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URL;
import java.text.ParseException;
import java.util.Date;

@Component
@Qualifier("jwtAuthenticationFilter")
@Profile("!dev")
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    // HS256 secret from Supabase dashboard (Base64-encoded)
    @Value("${supabase.jwt.secret}")
    private String jwtSecret;

    // (Optional) JWKS URL for future RS256 support
    @Value("${supabase.jwt.jwks-url:}")
    private String jwksUrl;

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

            boolean signatureValid;

            if (JWSAlgorithm.HS256.equals(alg)) {
                System.out.println("Using HS256 algorithm for JWT validation");
                byte[] secretBytes = jwtSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8);
                MACVerifier verifier = new MACVerifier(secretBytes);
                signatureValid = signedJWT.verify(verifier);
            }
            else if (JWSAlgorithm.RS256.equals(alg) && !jwksUrl.isBlank()) {
                System.out.println("Using RS256 algorithm for JWT validation with JWKS");
                JWKSet jwkSet = JWKSet.load(new URL(jwksUrl));
                JWK jwk = jwkSet.getKeyByKeyId(signedJWT.getHeader().getKeyID());
                RSAKey rsaKey = jwk != null ? (RSAKey) jwk : null;
                if (rsaKey == null) throw new SecurityException("Missing RS256 key");
                signatureValid = signedJWT.verify(new RSASSAVerifier(rsaKey));
            }
            else {
                throw new SecurityException("Unsupported JWT algorithm: " + alg);
            }

            if (!signatureValid) throw new SecurityException("Invalid signature");

            var claims = signedJWT.getJWTClaimsSet();

            if (new Date().after(claims.getExpirationTime())) {
                throw new SecurityException("Token expired");
            }

            String email = claims.getStringClaim("email");
            String role = claims.getStringClaim("role");
            if (email != null) {
                var userDetails = new UserPrincipal(email, "ROLE_" + role.toUpperCase());
                var auth = new UsernamePasswordAuthenticationToken(userDetails, null,
                        userDetails.getAuthorities());
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }

        } catch (ParseException | JOSEException | SecurityException e) {
            logger.error("JWT invalid: " + e.getMessage(), e);
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
