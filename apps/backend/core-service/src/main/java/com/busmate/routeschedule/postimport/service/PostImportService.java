package com.busmate.routeschedule.postimport.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.busmate.routeschedule.network.entity.Stop;
import com.busmate.routeschedule.network.repository.StopRepository;
import com.busmate.routeschedule.postimport.ai.PostReaderClient;
import com.busmate.routeschedule.postimport.ai.PostReaderException;
import com.busmate.routeschedule.postimport.dto.CheckedDeparture;
import com.busmate.routeschedule.postimport.dto.CreatePostImportRequest;
import com.busmate.routeschedule.postimport.dto.DraftResolutionRequest;
import com.busmate.routeschedule.postimport.dto.LoadResult;
import com.busmate.routeschedule.postimport.dto.PostImportDraftResponse;
import com.busmate.routeschedule.postimport.dto.PostImportDraftSummary;
import com.busmate.routeschedule.postimport.dto.PostReading;
import com.busmate.routeschedule.postimport.dto.ResolvedRow;
import com.busmate.routeschedule.postimport.dto.RowAction;
import com.busmate.routeschedule.postimport.dto.StopMatchCandidate;
import com.busmate.routeschedule.postimport.entity.PostImportDraft;
import com.busmate.routeschedule.postimport.entity.PostImportDraftStatus;
import com.busmate.routeschedule.postimport.entity.PostImportLoadStatus;
import com.busmate.routeschedule.postimport.repository.PostImportDraftRepository;
import com.busmate.routeschedule.shared.exception.BadRequestException;
import com.busmate.routeschedule.shared.exception.ResourceNotFoundException;
import com.busmate.routeschedule.shared.security.Caller;
import com.busmate.routeschedule.shared.util.StopNameMatcher;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

/**
 * Staff pastes a post, an AI reads it, code checks the reading (ADR-028, INC-060), staff correct and load it
 * (INC-061). Loading writes directly to BusMate's real stop/route/schedule/working data — the same way any
 * staff member already can by hand (ADR-025) — never through the contributor changeset system, which has no
 * entity type for a route or a schedule and would wrongly demand a second approver for something staff
 * already reviewed inside this draft.
 */
@Service
@RequiredArgsConstructor
public class PostImportService {

    private final PostImportDraftRepository drafts;
    private final PostReaderClient reader;
    private final PostImportChecks checks;
    private final PostImportLoader loader;
    private final StopRepository stopRepository;
    private final ObjectMapper objectMapper;

    @Value("${postimport.rate-limit.per-person-per-day:20}")
    private int perPersonDailyLimit;

    // Deliberately not @Transactional: reader.read() below is a slow external HTTP call (measured minutes
    // for a long real post) — wrapping it in a transaction would hold a database connection idle for that
    // whole time. countByCreatedByAndCreatedAtAfter() and drafts.save() each get their own short transaction
    // from Spring Data; nothing here needs atomicity spanning the AI call.
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

    /** Existing stops whose name might be what a place name in the post refers to — staff pick, code never does. */
    @Transactional(readOnly = true)
    public List<StopMatchCandidate> stopCandidates(String placeName) {
        if (placeName == null || placeName.isBlank()) {
            return List.of();
        }
        return stopRepository.findAllWithSearch(placeName, PageRequest.of(0, 10)).stream()
                .filter(s -> StopNameMatcher.namesMatch(placeName, s.getName()))
                .map(this::toCandidate)
                .toList();
    }

    private StopMatchCandidate toCandidate(Stop stop) {
        String city = stop.getLocation() != null ? stop.getLocation().getCity() : null;
        return new StopMatchCandidate(stop.getId(), stop.getName(), city);
    }

    @Transactional
    public PostImportDraftResponse saveResolution(UUID id, DraftResolutionRequest resolution) {
        PostImportDraft draft = requireReadDraft(id);
        draft.setResolution(objectMapper.valueToTree(resolution));
        draft.setUpdatedAt(Instant.now());
        return toResponse(drafts.save(draft));
    }

    @Transactional
    public PostImportDraftResponse approve(Caller staff, UUID id) {
        PostImportDraft draft = requireReadDraft(id);
        if (draft.getResolution() == null) {
            throw new BadRequestException("Save a resolution — every row's decision — before approving");
        }
        PostReading reading = readReading(draft.getAiResponse());
        DraftResolutionRequest resolution = objectMapper.convertValue(draft.getResolution(), DraftResolutionRequest.class);
        requireEveryFlagResolved(draft, reading, resolution);

        LoadResult result = loader.load(staff, resolution);
        draft.setLoadResult(objectMapper.valueToTree(result));
        draft.setLoadStatus(PostImportLoadStatus.LOADED);
        draft.setUpdatedAt(Instant.now());
        draft.setUpdatedBy(staff.auditId());
        return toResponse(drafts.save(draft));
    }

    /**
     * "A row flagged... or a line left unaccounted for, needs an explicit decision before the draft can be
     * approved" — a row the checks flagged may still be loaded, but only with a staff-written reason, and
     * every unaccounted line must be in the acknowledged list. Neither check is about correctness; both are
     * about nothing slipping through unnoticed.
     */
    private void requireEveryFlagResolved(PostImportDraft draft, PostReading reading, DraftResolutionRequest resolution) {
        if (resolution.rows().size() != reading.departures().size()) {
            throw new BadRequestException("The resolution must include a decision for every row the AI read");
        }

        List<DepartureCheck> groundingResults = checks.checkGrounding(draft.getPastedText(), reading);
        for (ResolvedRow row : resolution.rows()) {
            if (row.action() != RowAction.LOAD) {
                continue;
            }
            boolean wasFlagged = row.sourceIndex() >= 0 && row.sourceIndex() < groundingResults.size()
                    && !groundingResults.get(row.sourceIndex()).grounded();
            if (wasFlagged && (row.overrideReason() == null || row.overrideReason().isBlank())) {
                throw new BadRequestException(
                        "Row " + row.sourceIndex() + " was flagged and needs an override reason before it can be loaded");
            }
        }

        Set<String> acknowledged = new HashSet<>(
                resolution.acknowledgedUnaccountedLines() == null ? List.of() : resolution.acknowledgedUnaccountedLines());
        List<String> unaccounted = checks.checkCoverage(draft.getPastedText(), reading);
        List<String> missing = unaccounted.stream().filter(line -> !acknowledged.contains(line)).toList();
        if (!missing.isEmpty()) {
            throw new BadRequestException(
                    missing.size() + " unaccounted line(s) still need to be acknowledged before approving");
        }
    }

    private PostImportDraft requireReadDraft(UUID id) {
        PostImportDraft draft = drafts.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No post import " + id));
        if (draft.getStatus() != PostImportDraftStatus.READ) {
            throw new BadRequestException("This draft failed to read — nothing to resolve or approve");
        }
        return draft;
    }

    private PostImportDraftResponse toResponse(PostImportDraft draft) {
        if (draft.getStatus() == PostImportDraftStatus.FAILED) {
            return new PostImportDraftResponse(draft.getId(), draft.getPastedText(), draft.getAiProvider(),
                    draft.getAiModel(), draft.getStatus(), null, List.of(), List.of(), List.of(),
                    null, draft.getLoadStatus(), null, draft.getCreatedAt(), draft.getCreatedBy());
        }

        PostReading reading = readReading(draft.getAiResponse());
        List<CheckedDeparture> checked = checks.checkGrounding(draft.getPastedText(), reading).stream()
                .map(c -> new CheckedDeparture(c.departure(), c.grounded(), c.ungroundedFields()))
                .toList();
        List<String> unaccounted = checks.checkCoverage(draft.getPastedText(), reading);
        DraftResolutionRequest resolution = draft.getResolution() == null ? null
                : objectMapper.convertValue(draft.getResolution(), DraftResolutionRequest.class);
        LoadResult loadResult = draft.getLoadResult() == null ? null
                : objectMapper.convertValue(draft.getLoadResult(), LoadResult.class);

        return new PostImportDraftResponse(draft.getId(), draft.getPastedText(), draft.getAiProvider(),
                draft.getAiModel(), draft.getStatus(), reading.postDate(), checked, reading.skipped(), unaccounted,
                resolution, draft.getLoadStatus(), loadResult, draft.getCreatedAt(), draft.getCreatedBy());
    }

    private PostImportDraftSummary toSummary(PostImportDraft draft) {
        if (draft.getStatus() == PostImportDraftStatus.FAILED) {
            return new PostImportDraftSummary(draft.getId(), draft.getStatus(), draft.getAiProvider(), 0, 0, 0,
                    draft.getCreatedAt(), draft.getCreatedBy());
        }
        PostReading reading = readReading(draft.getAiResponse());
        long ungrounded = checks.checkGrounding(draft.getPastedText(), reading).stream().filter(c -> !c.grounded()).count();
        int unaccounted = checks.checkCoverage(draft.getPastedText(), reading).size();
        return new PostImportDraftSummary(draft.getId(), draft.getStatus(), draft.getAiProvider(),
                reading.departures().size(), (int) ungrounded, unaccounted, draft.getCreatedAt(), draft.getCreatedBy());
    }

    private PostReading readReading(JsonNode aiResponse) {
        return objectMapper.convertValue(aiResponse, PostReading.class);
    }
}
