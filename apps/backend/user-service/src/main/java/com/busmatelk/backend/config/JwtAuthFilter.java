package com.busmatelk.backend.config;

import com.busmatelk.backend.service.AccessTokenVerifier;
import com.busmatelk.backend.service.InvalidTokenException;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final AccessTokenVerifier accessTokenVerifier;

    public JwtAuthFilter(AccessTokenVerifier accessTokenVerifier) {
        this.accessTokenVerifier = accessTokenVerifier;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String jwt = authHeader.substring(7);

            try {
                Claims claims = accessTokenVerifier.verify(jwt);

                // Principal is the user id (sub claim, a UUID string) so it lines up with
                // PermissionCheckAspect and PermissionService, which key everything off userId.
                String userId = claims.getSubject();

                Map<String, Object> appMetadata = claims.get("app_metadata", Map.class);
                String userType = appMetadata != null ? (String) appMetadata.get("user_type") : null;

                var auth = new UsernamePasswordAuthenticationToken(
                        userId,                   // principal
                        null,                     // credentials (none)
                        List.of(new SimpleGrantedAuthority("ROLE_USER")) // authorities
                );
                auth.setDetails(userType);
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (InvalidTokenException e) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return; // stop filter chain
            }
        }

        filterChain.doFilter(request, response);
    }
}
