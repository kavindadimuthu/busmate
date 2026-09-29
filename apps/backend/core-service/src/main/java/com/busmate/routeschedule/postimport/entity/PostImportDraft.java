package com.busmate.routeschedule.postimport.entity;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.Type;

import com.fasterxml.jackson.databind.JsonNode;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

/**
 * A staff member's paste of a community post, and what the AI read from it (INC-060, ADR-028). Nothing here
 * touches a stop, route, schedule or working — this is a reading to be checked and reviewed, not a change.
 * {@code aiResponse} is exactly what the provider returned, already validated against the expected shape.
 */
@Getter
@Setter
@ToString(onlyExplicitlyIncluded = true)
@Entity
@Table(name = "post_import_draft")
public class PostImportDraft {

    @Id
    @GeneratedValue
    @Column(columnDefinition = "UUID")
    @ToString.Include
    private UUID id;

    @Column(name = "pasted_text", nullable = false)
    private String pastedText;

    @Column(name = "ai_provider", nullable = false)
    private String aiProvider;

    @Column(name = "ai_model", nullable = false)
    private String aiModel;

    @ToString.Exclude
    @Type(JsonType.class)
    @Column(name = "ai_response", columnDefinition = "jsonb", nullable = false)
    private JsonNode aiResponse;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PostImportDraftStatus status = PostImportDraftStatus.READ;

    /**
     * What staff decided (INC-061): edited rows, which to load or skip, stop matches, override reasons for a
     * flagged row, the source label and date. Null until a staff member has started reviewing. Kept separate
     * from {@link #aiResponse} on purpose — the AI's own answer is never overwritten by a correction to it.
     */
    @ToString.Exclude
    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private JsonNode resolution;

    @Enumerated(EnumType.STRING)
    @Column(name = "load_status", nullable = false)
    private PostImportLoadStatus loadStatus = PostImportLoadStatus.NOT_LOADED;

    /** What loading actually did, row by row: created, already there, or failed with a reason. */
    @ToString.Exclude
    @Type(JsonType.class)
    @Column(name = "load_result", columnDefinition = "jsonb")
    private JsonNode loadResult;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "updated_by")
    private String updatedBy;
}
