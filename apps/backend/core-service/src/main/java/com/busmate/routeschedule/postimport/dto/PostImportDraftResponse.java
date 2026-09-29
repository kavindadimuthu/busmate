package com.busmate.routeschedule.postimport.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.busmate.routeschedule.postimport.entity.PostImportDraftStatus;
import com.busmate.routeschedule.postimport.entity.PostImportLoadStatus;

/** The full detail view: the original text beside what the AI read from it and what the checks found. */
public record PostImportDraftResponse(
        UUID id,
        String pastedText,
        String aiProvider,
        String aiModel,
        PostImportDraftStatus status,
        String postDate,
        List<CheckedDeparture> departures,
        List<SkippedLine> skipped,
        List<String> unaccountedLines,
        DraftResolutionRequest resolution,
        PostImportLoadStatus loadStatus,
        LoadResult loadResult,
        Instant createdAt,
        String createdBy) {
}
