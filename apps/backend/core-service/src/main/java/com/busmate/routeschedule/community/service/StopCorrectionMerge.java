package com.busmate.routeschedule.community.service;

import java.util.Iterator;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * A correction changes what it says and nothing else (INC-043).
 *
 * A proposal carries only what the contributor's form sent, so a field they never saw — the Sinhala name,
 * the Tamil address — arrives as null. Written straight onto the stop, that erased the translations of
 * every stop that was ever corrected. Any optional field a correction leaves out (null, missing or blank)
 * is filled from the stop's current value instead, both when the proposal is stored, so the reviewer sees
 * what would really happen, and again when it is applied, so a proposal stored before this fix cannot do
 * the damage either.
 *
 * The price: a correction cannot blank a field, because "left empty" and "clear this" look the same on the
 * wire. Removing a value from a stop is a direct staff edit.
 */
final class StopCorrectionMerge {

    /** Optional top-level fields. Name is required and location coordinates are validated elsewhere. */
    private static final List<String> OPTIONAL_FIELDS = List.of("nameSinhala", "nameTamil", "description", "isAccessible");

    private StopCorrectionMerge() {
    }

    /** A copy of {@code proposed} with every gap filled from {@code current} (a serialised stop). */
    static ObjectNode fillGaps(JsonNode proposed, JsonNode current) {
        ObjectNode merged = proposed.deepCopy();

        for (String field : OPTIONAL_FIELDS) {
            if (isGap(merged.get(field)) && !isGap(current.get(field))) {
                merged.set(field, current.get(field));
            }
        }

        JsonNode currentLocation = current.get("location");
        if (currentLocation != null && currentLocation.isObject()) {
            ObjectNode location = merged.get("location") instanceof ObjectNode existing ? existing : merged.putObject("location");
            for (Iterator<Map.Entry<String, JsonNode>> it = currentLocation.fields(); it.hasNext();) {
                Map.Entry<String, JsonNode> entry = it.next();
                if (isGap(location.get(entry.getKey())) && !isGap(entry.getValue())) {
                    location.set(entry.getKey(), entry.getValue());
                }
            }
        }
        return merged;
    }

    private static boolean isGap(JsonNode value) {
        return value == null || value.isNull() || (value.isTextual() && value.asText().isBlank());
    }
}
