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

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "updated_by")
    private String updatedBy;
}
