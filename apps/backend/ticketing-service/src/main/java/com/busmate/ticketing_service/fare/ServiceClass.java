package com.busmate.ticketing_service.fare;

import java.util.Locale;
import java.util.Optional;

/**
 * The fare tier a journey is priced at — one column of {@code base_fare} each (INC-011).
 *
 * <p>These names match {@code core-service}'s bus service class exactly, because that is where the
 * value comes from: the bus a trip runs with decides the tier, and a client no longer has a say in
 * it.
 *
 * <p>{@link #resolve} accepts the separator-insensitive spellings that already exist in the wild
 * ({@code SEMI_LUXURY}, {@code semiluxury}, {@code Semi Luxury}). That tolerance is not cosmetic:
 * before this increment, a caller sending {@code SEMI_LUXURY} was matched against {@code semiluxury},
 * missed every branch, and got the string "Invalid type" back with a 200 status — so every
 * air-conditioned journey silently showed no fare at all.
 */
public enum ServiceClass {
    NORMAL,
    SEMI_LUXURY,
    LUXURY,
    SUPER_LUXURY,
    EXPRESSWAY_SUPER_LUXURY;

    /** Empty for an unrecognised tier — the caller decides whether that is an error or a default. */
    public static Optional<ServiceClass> resolve(String code) {
        if (code == null || code.isBlank()) {
            return Optional.empty();
        }
        String normalised = code.trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z]", "");
        for (ServiceClass candidate : values()) {
            if (candidate.name().replace("_", "").equals(normalised)) {
                return Optional.of(candidate);
            }
        }
        return Optional.empty();
    }
}
