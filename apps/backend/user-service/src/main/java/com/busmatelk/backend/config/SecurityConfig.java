package com.busmatelk.backend.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Autowired
    private CorsConfigurationSource corsConfigurationSource;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource)) // ✅ Enable CORS with custom
                                                                                 // configuration
                .csrf(csrf -> csrf.disable()) // ✅ New way to disable CSRF
                .authorizeHttpRequests(auth -> auth
                        // /api/auth/me and /api/auth/logout are intentionally excluded — they need
                        // an authenticated caller, matching the API gateway's own public/protected split.
                        // /internal/** is exempt from the JWT flow entirely — InternalApiKeyFilter is its
                        // only gate, and it's never reachable through the API gateway in the first place.
                        .requestMatchers("/public/**", "/swagger-ui/**", "/actuator/**",
                                "/swagger-ui.html", "/v3/api-docs/**", "/internal/**",
                                "/api/auth/register", "/api/auth/login", "/api/auth/refresh",
                                "/api/auth/forgot-password", "/api/auth/reset-password", "/api/auth/verify-email")
                        .permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
