package com.busmate.routeschedule.shared.util;

/**
 * Whether two stop names are the same place, written differently. Originally lived inside
 * {@code StopProposalService} for its coordinate-based duplicate check; INC-061 reuses it name-only, since a
 * pasted post never gives coordinates to narrow the search with.
 */
public final class StopNameMatcher {

    private StopNameMatcher() {
    }

    /**
     * Two names are "similar enough to ask about" if one contains the other, or if their first
     * word matches — the common case for an abbreviation ("Nugegoda Jn" for "Nugegoda Junction"),
     * which a plain substring check misses because the abbreviated word doesn't even share a
     * prefix with the word it stands for.
     */
    public static boolean namesMatch(String a, String b) {
        String normA = normalise(a);
        String normB = normalise(b);
        if (normA.isBlank() || normB.isBlank()) {
            return false;
        }
        if (normA.equals(normB) || normA.contains(normB) || normB.contains(normA)) {
            return true;
        }
        String firstA = normA.split(" ", 2)[0];
        String firstB = normB.split(" ", 2)[0];
        return !firstA.isBlank() && firstA.equals(firstB);
    }

    public static String normalise(String name) {
        return name == null ? "" : name.strip().toLowerCase().replaceAll("\\s+", " ");
    }
}
