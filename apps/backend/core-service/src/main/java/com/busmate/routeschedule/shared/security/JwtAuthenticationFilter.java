package com.busmate.routeschedule.shared.security;

import java.io.IOException;
import java.net.URL;
import java.text.ParseException;
import java.util.Date;
import java.util.Map;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
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
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Authenticates a request from the access token user-service issued (INC-016).
 *
 * <p>The token is verified here, RS256 against user-service's published JWKS, rather than
 * trusting the identity headers api-gateway forwards: authorisation decisions in this service
 * rest on the signature, not on what arrived in a header. The principal's name is the user id
 * ({@code sub}) and its single role is {@code ROLE_<USER_TYPE>} from
 * {@code app_metadata.user_type}, so {@code hasRole('OPERATOR')} and friends mean what they say.
 *
 * <p>An invalid or expired token leaves the request anonymous; the security rules then refuse
 * anything that is not public.
 */
@Component
@Qualifier("jwtAuthenticationFilter")
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final long JWKS_CACHE_DURATION_MS = 10 * 60 * 1000;
    private static final long MIN_REFRESH_INTERVAL_MS = 30 * 1000;

    @Value("${auth.jwks-url}")
    private String jwksUrl;

    private volatile JWKSet cachedJwkSet;
    private volatile long jwkSetLastFetched;

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

        try {
            JWTClaimsSet claims = verify(header.substring(7));
            String userId = claims.getSubject();
            String userType = userTypeOf(claims);
            if (userId != null && userType != null) {
                UserPrincipal principal = new UserPrincipal(userId, "ROLE_" + userType.toUpperCase());
                var auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        } catch (ParseException | JOSEException | SecurityException | IOException e) {
            logger.debug("Access token rejected: " + e.getMessage());
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    private JWTClaimsSet verify(String token) throws ParseException, JOSEException, IOException {
        SignedJWT jwt = SignedJWT.parse(token);
        if (!JWSAlgorithm.RS256.equals(jwt.getHeader().getAlgorithm())) {
            throw new SecurityException("Only RS256 access tokens are accepted");
        }

        String keyId = jwt.getHeader().getKeyID();
        JWK jwk = getJwkSet().getKeyByKeyId(keyId);
        if (jwk == null) {
            // The key may have rotated since the set was cached.
            jwk = refreshJwkSet().getKeyByKeyId(keyId);
            if (jwk == null) {
                throw new SecurityException("No published key matches kid " + keyId);
            }
        }

        if (!jwt.verify(new RSASSAVerifier((RSAKey) jwk))) {
            throw new SecurityException("Invalid signature");
        }
        JWTClaimsSet claims = jwt.getJWTClaimsSet();
        if (claims.getExpirationTime() == null || new Date().after(claims.getExpirationTime())) {
            throw new SecurityException("Token expired");
        }
        return claims;
    }

    private String userTypeOf(JWTClaimsSet claims) throws ParseException {
        Map<String, Object> appMetadata = claims.getJSONObjectClaim("app_metadata");
        if (appMetadata == null) {
            return null;
        }
        Object status = appMetadata.get("account_status");
        if ("suspended".equals(status) || "deactivated".equals(status) || "deleted".equals(status)) {
            return null;
        }
        Object userType = appMetadata.get("user_type");
        return userType instanceof String s && !s.isBlank() ? s : null;
    }

    private JWKSet getJwkSet() throws IOException, ParseException {
        if (cachedJwkSet != null && System.currentTimeMillis() - jwkSetLastFetched < JWKS_CACHE_DURATION_MS) {
            return cachedJwkSet;
        }
        return refreshJwkSet();
    }

    private synchronized JWKSet refreshJwkSet() throws IOException, ParseException {
        // A forged token with an unknown kid must not be able to make every request refetch.
        if (cachedJwkSet != null && System.currentTimeMillis() - jwkSetLastFetched < MIN_REFRESH_INTERVAL_MS) {
            return cachedJwkSet;
        }
        cachedJwkSet = JWKSet.load(new URL(jwksUrl));
        jwkSetLastFetched = System.currentTimeMillis();
        return cachedJwkSet;
    }
}
