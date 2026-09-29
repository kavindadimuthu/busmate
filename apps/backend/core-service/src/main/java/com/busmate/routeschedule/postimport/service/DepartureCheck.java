package com.busmate.routeschedule.postimport.service;

import java.util.List;

import com.busmate.routeschedule.postimport.dto.ReadDeparture;

/**
 * The grounding result for one {@link ReadDeparture} — which of its own claimed fields (other than
 * {@code notes}, which is free text) do not actually appear, even loosely, in the source lines it itself
 * quoted. An empty {@code ungroundedFields} means every claim the AI made about this departure is backed by
 * text it pointed at; it does not mean the reading is correct, only that it is not inventing a field its own
 * quoted lines don't contain.
 */
public record DepartureCheck(ReadDeparture departure, List<String> ungroundedFields) {

    public boolean grounded() {
        return ungroundedFields.isEmpty();
    }
}
