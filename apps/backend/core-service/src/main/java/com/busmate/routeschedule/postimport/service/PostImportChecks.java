package com.busmate.routeschedule.postimport.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

import com.busmate.routeschedule.postimport.dto.PostReading;
import com.busmate.routeschedule.postimport.dto.ReadDeparture;
import com.busmate.routeschedule.postimport.dto.SkippedLine;

/**
 * Deterministic, non-AI checks run against every {@link PostReading} before staff see it (ADR-028: "code
 * checks it"). Neither check judges whether a reading is *correct* — only whether it is internally honest:
 * grounding asks "is every claim backed by the text the AI itself quoted", coverage asks "did every line
 * that looks like a departure end up read as one, or explicitly set aside".
 */
@Component
public class PostImportChecks {

    /** A line worth accounting for: it has a time written on it (24h or am/pm), so it's plausibly a departure. */
    private static final Pattern TIMED_LINE = Pattern.compile(
            "\\b([01]?\\d|2[0-3])[.:][0-5]\\d\\s*(am|pm|AM|PM)?\\b");

    /** Grounding: for each claimed field, is its value (loosely, case-insensitively) present in the departure's own quoted source lines? */
    public List<DepartureCheck> checkGrounding(PostReading reading) {
        List<DepartureCheck> results = new ArrayList<>();
        for (ReadDeparture departure : reading.departures()) {
            String haystack = normalise(String.join(" ", nonNull(departure.sourceLines())));
            List<String> ungrounded = new ArrayList<>();
            checkField("time", departure.time(), haystack, ungrounded);
            checkField("origin", departure.origin(), haystack, ungrounded);
            checkField("destination", departure.destination(), haystack, ungrounded);
            checkField("operatorName", departure.operatorName(), haystack, ungrounded);
            checkField("serviceClass", departure.serviceClass(), haystack, ungrounded);
            for (String plate : nonNull(departure.plates())) {
                checkField("plates", plate, haystack, ungrounded);
            }
            results.add(new DepartureCheck(departure, ungrounded));
        }
        return results;
    }

    /**
     * Coverage: every timed line of the pasted text should be referenced, verbatim-ish, by some departure's
     * sourceLines or by a skipped entry's line. What's left over is handed back as "unaccounted" — staff
     * decide whether it matters, code never silently drops it.
     */
    public List<String> checkCoverage(String pastedText, PostReading reading) {
        List<String> accountedFor = new ArrayList<>();
        for (ReadDeparture departure : reading.departures()) {
            accountedFor.addAll(nonNull(departure.sourceLines()));
        }
        for (SkippedLine skipped : reading.skipped()) {
            if (skipped.line() != null) {
                accountedFor.add(skipped.line());
            }
        }
        List<String> normalisedAccounted = accountedFor.stream().map(this::normalise).toList();

        List<String> unaccounted = new ArrayList<>();
        for (String line : pastedText.lines().toList()) {
            String trimmed = line.trim();
            if (trimmed.isEmpty() || !TIMED_LINE.matcher(trimmed).find()) {
                continue;
            }
            String normalisedLine = normalise(trimmed);
            boolean matched = normalisedAccounted.stream()
                    .anyMatch(a -> a.contains(normalisedLine) || normalisedLine.contains(a));
            if (!matched) {
                unaccounted.add(trimmed);
            }
        }
        return unaccounted;
    }

    private void checkField(String fieldName, String value, String haystack, List<String> ungrounded) {
        if (value == null || value.isBlank()) {
            return;
        }
        if (!haystack.contains(normalise(value))) {
            ungrounded.add(fieldName);
        }
    }

    private String normalise(String s) {
        return s == null ? "" : s.toLowerCase(Locale.ROOT).replaceAll("\\s+", " ").trim();
    }

    private <T> List<T> nonNull(List<T> list) {
        return list == null ? List.of() : list;
    }
}
