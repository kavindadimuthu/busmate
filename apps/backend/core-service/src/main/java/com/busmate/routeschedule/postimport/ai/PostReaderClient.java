package com.busmate.routeschedule.postimport.ai;

import com.busmate.routeschedule.postimport.dto.PostReading;

/**
 * Reads a pasted community post into {@link PostReading} — a set of claims, not facts. ADR-028: the provider
 * is behind this interface on purpose, so Gemini can be swapped for another provider later without touching
 * anything that calls a reader. Every implementation must throw {@link PostReaderException} rather than
 * return a partial or best-guess reading; a malformed answer is rejected whole, never trusted in part.
 */
public interface PostReaderClient {

    /** The provider name recorded against every draft this client produces, e.g. {@code "gemini"}. */
    String providerName();

    /** The specific model recorded against every draft this client produces, e.g. {@code "gemini-2.5-flash"}. */
    String modelName();

    /**
     * Reads {@code pastedText} and returns the AI's structured claims about it.
     *
     * @throws PostReaderException if the provider is unreachable, refuses the request, or answers in a shape
     *         that does not fit {@link PostReading}.
     */
    PostReading read(String pastedText);
}
