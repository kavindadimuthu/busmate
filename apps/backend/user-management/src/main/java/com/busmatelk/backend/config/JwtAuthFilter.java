package com.busmatelk.backend.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final String supabaseSecret;

    public JwtAuthFilter(@Value("${supabase.jwt.secret}") String supabaseSecret) {
        this.supabaseSecret = supabaseSecret;
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
                Claims claims = Jwts.parser()
                        .setSigningKey(supabaseSecret.getBytes(StandardCharsets.UTF_8))
                        .parseClaimsJws(jwt)
                        .getBody();

                String email = claims.get("email", String.class);

                // 📌 Create an Authentication object and put it in the context
                var auth = new UsernamePasswordAuthenticationToken(
                        email,                    // principal
                        null,                     // credentials (none)
                        List.of(new SimpleGrantedAuthority("ROLE_USER")) // authorities
                );
                SecurityContextHolder.getContext().setAuthentication(auth);

                System.out.println("✅ Supabase‑authenticated user: " + email);

            } catch (JwtException e) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return; // stop filter chain
            }
        }

        filterChain.doFilter(request, response);
    }
}
