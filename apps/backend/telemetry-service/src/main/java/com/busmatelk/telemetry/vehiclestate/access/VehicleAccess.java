package com.busmatelk.telemetry.vehiclestate.access;

import com.busmatelk.telemetry.ingest.client.CoreServiceClient;
import com.busmatelk.telemetry.shared.exception.ForbiddenException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Locale;
import java.util.UUID;

/**
 * Decides who may read vehicle health (INC-024) from the identity the API gateway has already
 * verified and forwarded ({@code x-user-id}, {@code x-user-type}).
 *
 * <p>Deliberately not driven by Spring Security's roles: in the {@code dev} profile this service
 * treats any bearer token as an admin, so a role check there would let anyone through. Missing or
 * unrecognised identity is refused, and an operator whose link to a core-service operator cannot be
 * confirmed is refused rather than shown everything. The operator is looked up on every request,
 * uncached, so an account that stops being an operator stops seeing data at once.
 */
@Component
@RequiredArgsConstructor
public class VehicleAccess {

    private final CoreServiceClient coreServiceClient;

    public VehicleCaller resolve(String userId, String userType) {
        if (!StringUtils.hasText(userId) || !StringUtils.hasText(userType)) {
            throw new ForbiddenException("Vehicle data needs a signed-in staff or operator account");
        }
        UUID user;
        try {
            user = UUID.fromString(userId.trim());
        } catch (IllegalArgumentException e) {
            throw new ForbiddenException("Vehicle data needs a signed-in staff or operator account");
        }
        return switch (userType.trim().toLowerCase(Locale.ROOT)) {
            case "admin", "mot" -> VehicleCaller.staff();
            case "operator" -> coreServiceClient.getOperatorIdForUser(user)
                    .map(VehicleCaller::operator)
                    .orElseThrow(() -> new ForbiddenException("This operator account could not be confirmed"));
            default -> throw new ForbiddenException("Vehicle data is for staff and operators only");
        };
    }
}
