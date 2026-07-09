package com.busmate.routeschedule.fleet.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Builds a default bus seat layout from a plain seat count, for buses that have no explicit
 * {@code seatLayout} stored. Produces the canonical structure consumed by the conductor app:
 *
 * <pre>
 * {
 *   "layoutName": "2+2 Standard (49)",
 *   "rows": [ { "left": ["1","2"], "right": ["3","4"] }, ... , { "back": ["45",..,"49"] } ],
 *   "blockedSeats": []
 * }
 * </pre>
 *
 * Seat ids are string integers {@code "1".."N"}, numbered front-to-back, left-to-right — the same
 * scheme the ticketing-service stores in {@code Tickets.seatNumber}, so the app can match a booking
 * to a seat directly.
 */
@Component
@RequiredArgsConstructor
public class SeatLayoutFactory {

    private final ObjectMapper objectMapper;

    /**
     * @param capacity total seat count of the bus (must be positive; non-positive yields an
     *                 empty-rows layout rather than throwing, so mapping never fails).
     */
    public JsonNode defaultLayout(Integer capacity) {
        ObjectNode layout = objectMapper.createObjectNode();
        int seats = capacity != null && capacity > 0 ? capacity : 0;
        layout.put("layoutName", "2+2 Standard (" + seats + ")");

        ArrayNode rows = objectMapper.createArrayNode();

        // A standard Sri Lankan coach is 2+2 with a 5-across back row. When capacity % 4 == 1 we
        // treat the trailing 5 seats as that back row (e.g. 49 -> 11 rows of 4 + back of 5).
        // Otherwise fill 2+2 rows and place any remainder (0/2/3) in a shorter back row.
        int rem = seats % 4;
        int backCount;
        int fullRows;
        if (rem == 1 && seats >= 5) {
            backCount = 5;
            fullRows = (seats - 5) / 4;
        } else {
            backCount = rem;
            fullRows = seats / 4;
        }

        int seatNo = 1;
        for (int r = 0; r < fullRows; r++) {
            ObjectNode row = objectMapper.createObjectNode();
            ArrayNode left = objectMapper.createArrayNode();
            ArrayNode right = objectMapper.createArrayNode();
            left.add(String.valueOf(seatNo++));
            left.add(String.valueOf(seatNo++));
            right.add(String.valueOf(seatNo++));
            right.add(String.valueOf(seatNo++));
            row.set("left", left);
            row.set("right", right);
            rows.add(row);
        }

        if (backCount > 0) {
            ObjectNode backRow = objectMapper.createObjectNode();
            ArrayNode back = objectMapper.createArrayNode();
            for (int i = 0; i < backCount; i++) {
                back.add(String.valueOf(seatNo++));
            }
            backRow.set("back", back);
            rows.add(backRow);
        }

        layout.set("rows", rows);
        layout.set("blockedSeats", objectMapper.createArrayNode());
        return layout;
    }
}
