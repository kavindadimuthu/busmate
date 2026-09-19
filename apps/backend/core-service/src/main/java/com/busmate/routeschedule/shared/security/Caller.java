package com.busmate.routeschedule.shared.security;

import java.util.Set;
import java.util.UUID;

/**
 * Who is making the current request, as established by {@link JwtAuthenticationFilter}.
 *
 * @param userId   the user-service account id; null only for principals that are not real
 *                 accounts (test fixtures)
 * @param roles    the caller's roles without the {@code ROLE_} prefix, upper case
 */
public record Caller(UUID userId, Set<String> roles) {

    public static final String ADMIN = "ADMIN";
    public static final String MOT = "MOT";
    public static final String OPERATOR = "OPERATOR";
    public static final String CONDUCTOR = "CONDUCTOR";
    public static final String PASSENGER = "PASSENGER";

    public boolean hasRole(String role) {
        return roles.contains(role);
    }

    /** Regulator-side staff who may see and correct every operator's records. */
    public boolean isStaff() {
        return hasRole(ADMIN) || hasRole(MOT);
    }

    public boolean isOperator() {
        return hasRole(OPERATOR);
    }

    public boolean isConductor() {
        return hasRole(CONDUCTOR);
    }

    /** The caller's id as the audit string stored in created_by/updated_by columns. */
    public String auditId() {
        return userId != null ? userId.toString() : "system";
    }
}
