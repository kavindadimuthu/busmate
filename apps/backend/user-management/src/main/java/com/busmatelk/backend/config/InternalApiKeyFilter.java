package com.busmatelk.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * /internal/** is never routed through the API gateway and is exempt from the JWT flow
 * (see SecurityConfig) — this is its only gate, checked against a shared secret instead.
 */
@Component
public class InternalApiKeyFilter extends OncePerRequestFilter {

    private final String internalApiKey;

    public InternalApiKeyFilter(@Value("${internal.api-key}") String internalApiKey) {
        this.internalApiKey = internalApiKey;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (request.getRequestURI().startsWith("/internal")) {
            String providedKey = request.getHeader("X-Internal-Api-Key");
            if (providedKey == null || !MessageDigest.isEqual(
                    providedKey.getBytes(StandardCharsets.UTF_8), internalApiKey.getBytes(StandardCharsets.UTF_8))) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write(
                        "{\"error\":{\"code\":\"INVALID_INTERNAL_KEY\",\"message\":\"Missing or invalid X-Internal-Api-Key\"}}");
                return;
            }
        }
        filterChain.doFilter(request, response);
    }
}
