package com.busmate.routeschedule.community.service;

import java.util.List;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * A working correction changes what it says and nothing else — the same rule a stop's correction follows
 * (INC-043), applied here for a working (INC-058, ADR-027).
 *
 * A proposal carries only what the contributor's form sent; a field they left alone arrives as null or
 * missing and is filled from the working's current value instead, both when the proposal is stored (so a
 * reviewer sees what would really happen) and again when it is applied.
 */
final class WorkingCorrectionMerge {

    private static final List<String> OPTIONAL_SCALARS = List.of("operatorNameObserved", "serviceClass");

    private WorkingCorrectionMerge() {
    }

    /** A copy of {@code proposed} with every gap filled from {@code current} (a serialised working). */
    static ObjectNode fillGaps(JsonNode proposed, JsonNode current) {
        ObjectNode merged = proposed.deepCopy();

        for (String field : OPTIONAL_SCALARS) {
            if (isGap(merged.get(field)) && !isGap(current.get(field))) {
                merged.set(field, current.get(field));
            }
        }

        if (isGap(merged.get("platesObserved"))) {
            ArrayNode plates = merged.putArray("platesObserved");
            JsonNode vehicles = current.get("vehicles");
            if (vehicles != null && vehicles.isArray()) {
                for (JsonNode vehicle : vehicles) {
                    // The plate as seen if there is one, else the resolved plate — never a bus id: a correction
                    // never touches a registry link (INC-057 stays the only way to set one).
                    JsonNode plate = isGap(vehicle.get("plateObserved")) ? vehicle.get("plate") : vehicle.get("plateObserved");
                    if (!isGap(plate)) {
                        plates.add(plate.asText());
                    }
                }
            }
        }
        return merged;
    }

    private static boolean isGap(JsonNode value) {
        return value == null || value.isNull() || (value.isTextual() && value.asText().isBlank());
    }
}
