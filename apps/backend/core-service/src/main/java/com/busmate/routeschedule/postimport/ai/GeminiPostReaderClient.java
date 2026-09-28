package com.busmate.routeschedule.postimport.ai;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.busmate.routeschedule.postimport.dto.PostReading;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * Reads a pasted post with Gemini, constrained to {@link PostReading}'s shape via structured output
 * (ADR-028). The prompt asks for a literal, line-by-line reading and nothing else — no route- or
 * stop-matching, no judgement calls about trustworthiness; that is code's job (grounding/coverage checks),
 * done after this call returns, never delegated to the model.
 *
 * <p>The API key may be blank at startup (local dev without one, tests) — this class only fails when
 * {@link #read} is actually called with no key configured, never at construction.
 */
@Component
public class GeminiPostReaderClient implements PostReaderClient {

    private static final String API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

    private final RestClient restClient = RestClient.builder().baseUrl(API_BASE).build();
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String model;

    public GeminiPostReaderClient(
            ObjectMapper objectMapper,
            @Value("${gemini.api-key:}") String apiKey,
            @Value("${gemini.post-import-model:gemini-2.5-flash}") String model) {
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.model = model;
    }

    @Override
    public String providerName() {
        return "gemini";
    }

    @Override
    public String modelName() {
        return model;
    }

    @Override
    public PostReading read(String pastedText) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new PostReaderException("Gemini API key is not configured on this server.");
        }

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", buildPrompt(pastedText))))),
                "generationConfig", Map.of(
                        "temperature", 0.1,
                        "responseMimeType", "application/json",
                        "responseSchema", buildResponseSchema()));

        JsonNodeResponse response;
        try {
            response = restClient.post()
                    .uri("/{model}:generateContent?key={key}", model, apiKey)
                    .body(requestBody)
                    .retrieve()
                    .body(JsonNodeResponse.class);
        } catch (RestClientException e) {
            throw new PostReaderException("Could not reach Gemini: " + e.getMessage(), e);
        }

        String text = extractText(response);
        try {
            return objectMapper.readValue(text, PostReading.class);
        } catch (Exception e) {
            throw new PostReaderException("Gemini's answer did not fit the expected reading shape.", e);
        }
    }

    private String buildPrompt(String pastedText) {
        return """
                You are reading a public transport timetable notice, written by hand for other people to read \
                — usually a Facebook post, in Sinhala, English or a mix. Read it literally. Do not use outside \
                knowledge of Sri Lankan routes, operators or places to fill in anything the text does not say.

                For every scheduled departure the text names, record: the time as written, the origin, the \
                destination, the operator name if named, any vehicle plate numbers if named, a service class \
                if named (e.g. "luxury", "semi luxury", "normal"), which days it runs if stated, any other \
                note, and — this is required — the exact line(s) of the text this departure came from, quoted \
                verbatim, in "sourceLines".

                For every line of the text that is NOT a departure (headings, disclaimers, fare tables, \
                general remarks), list it under "skipped" with a short reason. Every line of the original \
                text should end up referenced either by a departure's sourceLines or by a skipped entry.

                If the post itself states a date it was written or applies from, put it in "postDate" exactly \
                as written. If no date is stated anywhere in the text, leave "postDate" out.

                Text:
                %s
                """.formatted(pastedText);
    }

    /** Gemini's structured-output schema is a constrained subset of OpenAPI's Schema object. */
    private ObjectNode buildResponseSchema() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "OBJECT");

        ObjectNode departureItem = objectMapper.createObjectNode();
        departureItem.put("type", "OBJECT");
        ObjectNode departureProps = departureItem.putObject("properties");
        for (String stringField : List.of("time", "origin", "destination", "operatorName", "serviceClass",
                "days", "notes")) {
            departureProps.putObject(stringField).put("type", "STRING");
        }
        departureProps.putObject("plates").put("type", "ARRAY")
                .putObject("items").put("type", "STRING");
        departureProps.putObject("sourceLines").put("type", "ARRAY")
                .putObject("items").put("type", "STRING");
        departureItem.set("required", stringArray("sourceLines"));

        ObjectNode skippedItem = objectMapper.createObjectNode();
        skippedItem.put("type", "OBJECT");
        ObjectNode skippedProps = skippedItem.putObject("properties");
        skippedProps.putObject("line").put("type", "STRING");
        skippedProps.putObject("reason").put("type", "STRING");
        skippedItem.set("required", stringArray("line"));

        ObjectNode properties = schema.putObject("properties");
        properties.putObject("postDate").put("type", "STRING");
        properties.putObject("departures").put("type", "ARRAY").set("items", departureItem);
        properties.putObject("skipped").put("type", "ARRAY").set("items", skippedItem);

        schema.set("required", stringArray("departures", "skipped"));
        return schema;
    }

    private ArrayNode stringArray(String... values) {
        ArrayNode array = objectMapper.createArrayNode();
        for (String value : values) {
            array.add(value);
        }
        return array;
    }

    private String extractText(JsonNodeResponse response) {
        if (response == null || response.candidates == null || response.candidates.isEmpty()) {
            throw new PostReaderException("Gemini returned no candidates — the request may have been blocked.");
        }
        var parts = response.candidates.get(0).content != null ? response.candidates.get(0).content.parts : null;
        if (parts == null || parts.isEmpty() || parts.get(0).text == null) {
            throw new PostReaderException("Gemini returned an empty answer.");
        }
        return parts.get(0).text;
    }

    private record JsonNodeResponse(List<Candidate> candidates) {
    }

    private record Candidate(Content content) {
    }

    private record Content(List<Part> parts) {
    }

    private record Part(String text) {
    }
}
