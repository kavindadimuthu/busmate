package com.busmate.routeschedule.postimport.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.busmate.routeschedule.postimport.ai.PostReaderClient;
import com.busmate.routeschedule.postimport.ai.PostReaderException;
import com.busmate.routeschedule.postimport.dto.CheckedDeparture;
import com.busmate.routeschedule.postimport.dto.CreatePostImportRequest;
import com.busmate.routeschedule.postimport.dto.PostImportDraftResponse;
import com.busmate.routeschedule.postimport.dto.PostImportDraftSummary;
import com.busmate.routeschedule.postimport.dto.PostReading;
import com.busmate.routeschedule.postimport.entity.PostImportDraft;
import com.busmate.routeschedule.postimport.entity.PostImportDraftStatus;
import com.busmate.routeschedule.postimport.repository.PostImportDraftRepository;
import com.busmate.routeschedule.shared.exception.BadRequestException;
import com.busmate.routeschedule.shared.exception.ResourceNotFoundException;
import com.busmate.routeschedule.shared.security.Caller;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

/**
 * Staff pastes a post, an AI reads it, code checks the reading (ADR-028, INC-060). This service owns only
 * that first half — reading and checking. Nothing here matches a stop, touches a schedule, or writes a
 * changeset; that's INC-061, and it starts from an already-reviewed draft, never straight from an AI answer.
 */
@Service
@RequiredArgsConstructor
public class PostImportService {

    private final PostImportDraftRepository drafts;
    private final PostReaderClient reader;
    private final PostImportChecks checks;
    private final ObjectMapper objectMapper;

    @Value("${postimport.rate-limit.per-person-per-day:20}")
    private int perPersonDailyLimit;

    @Transactional
    public PostImportDraftResponse create(Caller staff, CreatePostImportRequest request) {
        Instant since = Instant.now().minus(1, ChronoUnit.DAYS);
        long recent = drafts.countByCreatedByAndCreatedAtAfter(staff.auditId(), since);
        if (recent >= perPersonDailyLimit) {
            throw new BadRequestException(
                    "You've read " + recent + " posts in the last day — that's the limit for now.");
        }

        PostImportDraft draft = new PostImportDraft();
        draft.setPastedText(request.pastedText());
        draft.setAiProvider(reader.providerName());
        draft.setAiModel(reader.modelName());
        draft.setCreatedAt(Instant.now());
        draft.setCreatedBy(staff.auditId());

        try {
            PostReading reading = reader.read(request.pastedText());
            draft.setAiResponse(objectMapper.valueToTree(reading));
            draft.setStatus(PostImportDraftStatus.READ);
        } catch (PostReaderException e) {
            draft.setAiResponse(objectMapper.createObjectNode().put("error", e.getMessage()));
            draft.setStatus(PostImportDraftStatus.FAILED);
        }

        return toResponse(drafts.save(draft));
    }

    @Transactional(readOnly = true)
    public PostImportDraftResponse get(UUID id) {
        return toResponse(drafts.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No post import " + id)));
    }

    @Transactional(readOnly = true)
    public Page<PostImportDraftSummary> list(Pageable pageable) {
        return drafts.findAllByOrderByCreatedAtDesc(pageable).map(this::toSummary);
    }

    private PostImportDraftResponse toResponse(PostImportDraft draft) {
        if (draft.getStatus() == PostImportDraftStatus.FAILED) {
            return new PostImportDraftResponse(draft.getId(), draft.getPastedText(), draft.getAiProvider(),
                    draft.getAiModel(), draft.getStatus(), null, List.of(), List.of(), List.of(),
                    draft.getCreatedAt(), draft.getCreatedBy());
        }

        PostReading reading = readReading(draft.getAiResponse());
        List<CheckedDeparture> checked = checks.checkGrounding(reading).stream()
                .map(c -> new CheckedDeparture(c.departure(), c.grounded(), c.ungroundedFields()))
                .toList();
        List<String> unaccounted = checks.checkCoverage(draft.getPastedText(), reading);

        return new PostImportDraftResponse(draft.getId(), draft.getPastedText(), draft.getAiProvider(),
                draft.getAiModel(), draft.getStatus(), reading.postDate(), checked, reading.skipped(), unaccounted,
                draft.getCreatedAt(), draft.getCreatedBy());
    }

    private PostImportDraftSummary toSummary(PostImportDraft draft) {
        if (draft.getStatus() == PostImportDraftStatus.FAILED) {
            return new PostImportDraftSummary(draft.getId(), draft.getStatus(), draft.getAiProvider(), 0, 0, 0,
                    draft.getCreatedAt(), draft.getCreatedBy());
        }
        PostReading reading = readReading(draft.getAiResponse());
        long ungrounded = checks.checkGrounding(reading).stream().filter(c -> !c.grounded()).count();
        int unaccounted = checks.checkCoverage(draft.getPastedText(), reading).size();
        return new PostImportDraftSummary(draft.getId(), draft.getStatus(), draft.getAiProvider(),
                reading.departures().size(), (int) ungrounded, unaccounted, draft.getCreatedAt(), draft.getCreatedBy());
    }

    private PostReading readReading(JsonNode aiResponse) {
        return objectMapper.convertValue(aiResponse, PostReading.class);
    }
}
