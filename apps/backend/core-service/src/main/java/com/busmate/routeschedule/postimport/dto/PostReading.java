package com.busmate.routeschedule.postimport.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * The whole shape a post reader (AI or otherwise) must answer in. This is the schema handed to Gemini as
 * structured output, so a reply that doesn't fit it is a schema violation the provider itself won't produce —
 * the {@link com.busmate.routeschedule.postimport.ai.PostReaderClient} still rejects a malformed reply whole
 * rather than trust a partial one.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record PostReading(String postDate, List<ReadDeparture> departures, List<SkippedLine> skipped) {
}
