package com.busmate.routeschedule.postimport.dto;

import java.time.Instant;
import java.util.UUID;

import com.busmate.routeschedule.postimport.entity.PostImportDraftStatus;

/** One row of the "past imports" list — enough to pick which draft to open, not the full reading. */
public record PostImportDraftSummary(
        UUID id,
        PostImportDraftStatus status,
        String aiProvider,
        int departureCount,
        int ungroundedCount,
        int unaccountedCount,
        Instant createdAt,
        String createdBy) {
}
