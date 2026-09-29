package com.busmate.routeschedule.postimport.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * One departure as the AI read it from a pasted post — a claim to be checked, not a fact. {@code sourceLines}
 * is the AI's own quote of the text it read this departure from; the grounding check (pure Java, no AI) uses
 * it to confirm the claim is actually backed by the text, and staff use it to judge the reading themselves.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ReadDeparture(
        String time,
        String origin,
        String destination,
        String operatorName,
        List<String> plates,
        String serviceClass,
        String days,
        String notes,
        List<String> sourceLines) {
}
