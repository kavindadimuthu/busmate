package com.busmatelk.telemetry.ingest.security;

import com.busmatelk.telemetry.device.entity.Device;
import com.busmatelk.telemetry.device.entity.DeviceCredential;
import com.busmatelk.telemetry.device.entity.DeviceStatus;
import com.busmatelk.telemetry.device.repository.DeviceCredentialRepository;
import com.busmatelk.telemetry.device.repository.DeviceRepository;
import com.busmatelk.telemetry.device.service.DeviceTokens;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Authenticates {@code /ingest/**} requests against a device's own bearer token — entirely
 * separate from the staff-auth path ({@code GatewayAuthenticationFilter}/{@code
 * MockJwtAuthenticationFilter}), which is why this checks the path itself rather than relying on
 * filter ordering: it is a strict no-op for every other path, so it can never interfere with staff
 * auth, and (see those two filters) they now explicitly skip {@code /ingest/**} in return, so
 * exactly one of the two authentication mechanisms ever applies to a given request.
 *
 * <p>On success, sets a {@code ROLE_DEVICE} authentication (satisfying SecurityConfig's
 * {@code /ingest/**}.authenticated() rule) and stashes the resolved device id as a request
 * attribute for the controller to read via {@code @RequestAttribute}. On any failure — missing/
 * malformed token, unknown/expired/revoked credential, disabled or retired device, or the
 * device's rate limit being exceeded — it leaves the request unauthenticated (429 for the rate
 * limit case is written directly here, since that isn't something the security-rule rejection
 * path expresses); the request otherwise falls through and SecurityConfig's `authenticated()`
 * rule rejects it in the ordinary way.
 */
@Component
@RequiredArgsConstructor
public class DeviceTokenAuthenticationFilter extends OncePerRequestFilter {

    public static final String DEVICE_ID_ATTRIBUTE = "deviceId";
    private static final String TOKEN_PREFIX = "bmt_";

    private final DeviceCredentialRepository credentialRepository;
    private final DeviceRepository deviceRepository;
    private final DeviceRateLimiter rateLimiter;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (!request.getRequestURI().startsWith("/ingest/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);
        if (!token.startsWith(TOKEN_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        Optional<DeviceCredential> credential =
                credentialRepository.findActiveBySecretHash(DeviceTokens.hash(token), Instant.now());
        if (credential.isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }

        Optional<Device> deviceOpt = deviceRepository.findById(credential.get().getDeviceId());
        if (deviceOpt.isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }

        Device device = deviceOpt.get();
        if (device.getStatus() == DeviceStatus.DISABLED || device.getStatus() == DeviceStatus.RETIRED) {
            filterChain.doFilter(request, response);
            return;
        }

        if (!rateLimiter.tryConsume(device.getId())) {
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"error\":{\"code\":\"RATE_LIMITED\",\"message\":\"Too many requests for this device\"}}");
            return;
        }

        var principal = new UsernamePasswordAuthenticationToken(
                device.getId().toString(), null, List.of(new SimpleGrantedAuthority("ROLE_DEVICE")));
        principal.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(principal);

        request.setAttribute(DEVICE_ID_ATTRIBUTE, device.getId());
        filterChain.doFilter(request, response);
    }
}
