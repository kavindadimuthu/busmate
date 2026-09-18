package com.busmate.routeschedule.fleet.service;

import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;

import org.springframework.stereotype.Component;

import com.busmate.routeschedule.shared.exception.BadRequestException;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * Checks a seat layout before it is stored (INC-018). The layout is read by the conductor app, the
 * passenger apps and ticketing-service's seat checks, so a malformed one breaks all of them at
 * once:
 *
 * <pre>
 * { "layoutName": "2+2 (49)",
 *   "rows": [ { "left": ["1","2"], "right": ["3","4"] }, ..., { "back": ["45",...,"49"] } ],
 *   "blockedSeats": ["2"] }
 * </pre>
 *
 * Every seat id appears once; blocked seats are seats of this layout; and the number of seats is
 * the bus's capacity, so the two can never disagree.
 */
@Component
public class SeatLayoutValidator {

    private static final Set<String> ROW_KEYS = Set.of("left", "right", "back");
    private static final int MAX_SEATS_PER_SIDE = 6;

    public void validate(JsonNode layout, Integer capacity) {
        if (layout == null || layout.isNull()) {
            return; // absent layout: a default is generated from capacity when read
        }
        if (!layout.isObject() || !layout.path("rows").isArray() || layout.path("rows").isEmpty()) {
            throw new BadRequestException("Seat layout must have at least one row");
        }
        JsonNode name = layout.get("layoutName");
        if (name != null && !name.isNull() && (!name.isTextual() || name.asText().length() > 100)) {
            throw new BadRequestException("Seat layout name must be text of at most 100 characters");
        }

        Set<String> seats = new HashSet<>();
        int rowNumber = 0;
        for (JsonNode row : layout.get("rows")) {
            rowNumber++;
            if (!row.isObject()) {
                throw new BadRequestException("Seat layout row " + rowNumber + " is not an object");
            }
            Iterator<String> keys = row.fieldNames();
            boolean hasSeats = false;
            while (keys.hasNext()) {
                String key = keys.next();
                if (!ROW_KEYS.contains(key)) {
                    throw new BadRequestException("Seat layout row " + rowNumber + " has an unknown side '" + key + "'");
                }
                JsonNode side = row.get(key);
                if (!side.isArray() || side.size() > ("back".equals(key) ? MAX_SEATS_PER_SIDE + 2 : MAX_SEATS_PER_SIDE)) {
                    throw new BadRequestException("Seat layout row " + rowNumber + " '" + key + "' must be a list of at most "
                            + ("back".equals(key) ? MAX_SEATS_PER_SIDE + 2 : MAX_SEATS_PER_SIDE) + " seats");
                }
                for (JsonNode seat : side) {
                    String id = seat.isTextual() || seat.isNumber() ? seat.asText().trim() : "";
                    if (id.isEmpty() || id.length() > 10) {
                        throw new BadRequestException("Seat layout row " + rowNumber + " has an invalid seat number");
                    }
                    if (!seats.add(id)) {
                        throw new BadRequestException("Seat " + id + " appears more than once in the layout");
                    }
                    hasSeats = true;
                }
            }
            if (!hasSeats) {
                throw new BadRequestException("Seat layout row " + rowNumber + " has no seats");
            }
        }

        JsonNode blocked = layout.get("blockedSeats");
        if (blocked != null && !blocked.isNull()) {
            if (!blocked.isArray()) {
                throw new BadRequestException("blockedSeats must be a list of seat numbers");
            }
            for (JsonNode seat : blocked) {
                if (!seats.contains(seat.asText().trim())) {
                    throw new BadRequestException("Blocked seat " + seat.asText() + " is not a seat in the layout");
                }
            }
        }

        if (capacity != null && seats.size() != capacity) {
            throw new BadRequestException("The layout has " + seats.size() + " seats but the capacity is " + capacity
                    + "; they must match");
        }
    }
}
