package com.busmatelk.telemetry.shared.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Profile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Trusts the identity headers the API gateway sets after it has verified the access token —
 * {@code x-user-id}, {@code x-user-type}, {@code x-user-email} (see api-gateway auth.middleware).
 * The gateway is the only ingress to this service, so re-validating the JWT here would be redundant;
 * we map the forwarded user type to a Spring role ({@code ROLE_<TYPE>}) so @PreAuthorize checks work
 * the same as in the other services. Active in every profile except dev (which uses the mock filter).
 *
 * <p>Never clears an existing authentication — if no gateway headers are present the request simply
 * stays anonymous and the authorization rules reject it, which also lets @WithMockUser drive tests.
 */
@Component
@Qualifier("jwtAuthenticationFilter")
@Profile("!dev")
public class GatewayAuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String userId = request.getHeader("x-user-id");
        String userType = request.getHeader("x-user-type");

        if (StringUtils.hasText(userId)) {
            String email = request.getHeader("x-user-email");
            String username = StringUtils.hasText(email) ? email : userId;
            String role = "ROLE_" + (StringUtils.hasText(userType) ? userType : "user").toUpperCase();

            var principal = new UserPrincipal(username, role);
            var auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
            auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        filterChain.doFilter(request, response);
    }
}
