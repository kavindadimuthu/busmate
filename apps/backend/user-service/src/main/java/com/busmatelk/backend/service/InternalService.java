package com.busmatelk.backend.service;

import com.busmatelk.backend.dto.response.InternalUserResponse;
import com.busmatelk.backend.model.User;
import com.busmatelk.backend.model.UserPermissionOverride;
import com.busmatelk.backend.model.UserTypePermission;
import com.busmatelk.backend.repository.UserPermissionOverrideRepository;
import com.busmatelk.backend.repository.UserRepository;
import com.busmatelk.backend.repository.UserTypePermissionRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InternalService {

    private final UserRepository userRepository;
    private final UserPermissionOverrideRepository overrideRepository;
    private final UserTypePermissionRepository typePermissionRepository;

    @Value("${supabase.jwt.secret}")
    private String jwtSecret;

    public InternalUserResponse getUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + userId));
        return toResponse(user);
    }

    /**
     * Re-implements PermissionService.hasPermission()'s override-then-type-fallback logic
     * (rather than modifying that already-relied-upon method) because this endpoint also
     * needs to report which step produced the answer.
     */
    public PermissionResolution checkPermission(UUID userId, String permissionName) {
        Optional<UserPermissionOverride> override = overrideRepository.findByUserUserIdAndPermissionName(userId, permissionName);
        if (override.isPresent()) {
            UserPermissionOverride o = override.get();
            boolean expired = o.getExpiresAt() != null && o.getExpiresAt().isBefore(Instant.now());
            if (!expired) {
                return new PermissionResolution(Boolean.TRUE.equals(o.getIsGranted()), "user_override");
            }
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + userId));
        Optional<UserTypePermission> typePermission = typePermissionRepository
                .findByUserTypeIdAndPermissionName(user.getUserType().getId(), permissionName);

        boolean granted = typePermission.map(UserTypePermission::getIsGranted).orElse(false);
        return new PermissionResolution(granted, "user_type_permission");
    }

    public InternalUserResponse validateToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .setSigningKey(jwtSecret.getBytes(StandardCharsets.UTF_8))
                    .parseClaimsJws(token)
                    .getBody();

            String userId = claims.getSubject();
            String email = claims.get("email", String.class);
            Map<String, Object> appMetadata = claims.get("app_metadata", Map.class);
            String userType = appMetadata != null ? (String) appMetadata.get("user_type") : null;
            String accountStatus = appMetadata != null ? (String) appMetadata.get("account_status") : null;

            return new InternalUserResponse(UUID.fromString(userId), email, userType, accountStatus);
        } catch (JwtException | IllegalArgumentException e) {
            throw new InvalidTokenException("Invalid or expired token");
        }
    }

    private InternalUserResponse toResponse(User user) {
        return new InternalUserResponse(user.getUserId(), user.getEmail(), user.getUserType().getName(), user.getAccountStatus());
    }
}
