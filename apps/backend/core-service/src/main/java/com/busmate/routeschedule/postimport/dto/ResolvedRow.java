package com.busmate.routeschedule.postimport.dto;

import java.util.List;
import java.util.UUID;

/**
 * A staff member's decision about one row of the AI's reading: what to load (their own corrected values, not
 * necessarily the AI's), or to skip it entirely. {@code sourceIndex} ties it back to the matching row of the
 * original {@code aiResponse.departures} — never re-ordered, never re-numbered by an edit.
 *
 * <p>{@code originStopId}/{@code destinationStopId} are set only when staff picked a specific existing stop
 * from a search; left null, loading matches by name itself and creates a stop if nothing matches — code
 * decides, per ADR-028, never the AI.
 *
 * <p>{@code overrideReason} is required at approval time for any row that was flagged (grounding or
 * coverage) and is still being loaded — the accountable "I looked at this and I'm loading it anyway", not a
 * blanket switch that silences the check.
 */
public record ResolvedRow(
        int sourceIndex,
        RowAction action,
        String time,
        String origin,
        String destination,
        String operatorName,
        List<String> plates,
        String serviceClass,
        String days,
        String notes,
        UUID originStopId,
        UUID destinationStopId,
        String overrideReason) {
}
