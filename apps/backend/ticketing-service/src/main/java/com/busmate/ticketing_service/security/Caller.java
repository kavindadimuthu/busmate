package com.busmate.ticketing_service.security;

import com.busmate.ticketing_service.exception.ForbiddenException;
import com.busmate.ticketing_service.exception.UnauthenticatedException;

import java.util.Locale;
import java.util.Set;

/**
 * Who is making a request, taken from the headers api-gateway sets after it verifies the JWT
 * (INC-011). Before this, ticketing-service took the passenger's identity from the request body,
 * so any signed-in user could book, read or cancel as anybody else.
 *
 * <p>Every frontend reaches this service through the gateway and nothing else does (context.md
 * invariant 1), so these headers are trustworthy in a way a body field never was.
 */
public record Caller(String userId, String userType) {

    /**
     * Roles that legitimately see other people's tickets: regulators, the operator running the
     * bus, stand staff, and the conductor on board. A passenger is not one of them.
     */
    private static final Set<String> STAFF_TYPES = Set.of("admin", "mot", "operator", "timekeeper", "conductor");

    public static Caller of(String userId, String userType) {
        if (userId == null || userId.isBlank()) {
            throw new UnauthenticatedException("Sign in to continue");
        }
        return new Caller(userId, userType == null ? "" : userType.toLowerCase(Locale.ROOT));
    }

    public boolean isStaff() {
        return STAFF_TYPES.contains(userType);
    }

    public boolean owns(String passengerId) {
        return passengerId != null && passengerId.equals(userId);
    }

    /**
     * Staff see anyone's ticket; a passenger sees only their own. The message deliberately does not
     * say whether the ticket exists - telling a stranger "that one is someone else's" still tells
     * them it is real.
     */
    public void requireOwnershipOrStaff(String passengerId) {
        if (!isStaff() && !owns(passengerId)) {
            throw new ForbiddenException("This ticket is not available to you");
        }
    }
}
