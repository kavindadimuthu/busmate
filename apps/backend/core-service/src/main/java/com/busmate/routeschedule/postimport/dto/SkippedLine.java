package com.busmate.routeschedule.postimport.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * A line of the post the AI decided was not a departure (a disclaimer, a fare table row, a heading) — named
 * on purpose so the coverage check can tell "the AI saw this and set it aside" from "the AI missed this".
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record SkippedLine(String line, String reason) {
}
