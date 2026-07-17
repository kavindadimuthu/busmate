package com.busmatelk.telemetry.shared.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Profile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Dev-only stand-in for {@link GatewayAuthenticationFilter}: any {@code Bearer} token authenticates
 * as an admin so Swagger UI and local curl can exercise the protected device APIs without the
 * gateway in front. Mirrors core-service's dev mock filter.
 */
@Component
@Qualifier("jwtAuthenticationFilter")
@Profile("dev")
public class MockJwtAuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        // /ingest/** authenticates devices via DeviceTokenAuthenticationFilter — this mock must
        // not treat a device's bmt_ token as a staff Bearer token (dev is the default active
        // profile, so this filter is exactly what a local curl against /ingest would otherwise hit).
        if (request.getRequestURI().startsWith("/ingest/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            UserDetails userDetails = new UserPrincipal("dev-user", "ROLE_ADMIN,ROLE_USER");
            var authentication = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }
        filterChain.doFilter(request, response);
    }
}
