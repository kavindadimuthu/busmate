package com.busmatelk.telemetry.config;

import com.busmatelk.telemetry.ingest.security.DeviceTokenAuthenticationFilter;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Mirrors the other services' security setup: stateless, JWT/gateway-header filter, docs and
 * actuator open, everything under /api/telemetry/** authenticated (role checks are on the
 * controllers via @PreAuthorize). The liveness /api/telemetry/info endpoint stays public.
 *
 * <p>{@code /ingest/**} (Phase 2) is a second, entirely separate authenticated area: devices, not
 * staff, authenticate there via {@link DeviceTokenAuthenticationFilter}. Both filters run on every
 * request but are mutually exclusive by path (each checks the URI itself — see their class docs),
 * so registering both here is safe regardless of their relative order.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final OncePerRequestFilter jwtAuthenticationFilter;
    private final DeviceTokenAuthenticationFilter deviceTokenAuthenticationFilter;
    private final CorsConfigurationSource corsConfigurationSource;

    public SecurityConfig(@Qualifier("jwtAuthenticationFilter") OncePerRequestFilter jwtAuthenticationFilter,
                          DeviceTokenAuthenticationFilter deviceTokenAuthenticationFilter,
                          CorsConfigurationSource corsConfigurationSource) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.deviceTokenAuthenticationFilter = deviceTokenAuthenticationFilter;
        this.corsConfigurationSource = corsConfigurationSource;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html", "/actuator/**").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Phase 0 liveness endpoint — safe to expose (name + topic list only).
                        .requestMatchers(HttpMethod.GET, "/api/telemetry/info").permitAll()
                        // Phase 3: read-only live-position lookup, consumed server-to-server by
                        // core-service and api-gateway — same "public GET" convention core-service
                        // itself uses for non-sensitive read APIs.
                        .requestMatchers(HttpMethod.GET, "/api/live/**").permitAll()
                        .requestMatchers("/api/**").authenticated()
                        .requestMatchers("/ingest/**").authenticated()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(deviceTokenAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
