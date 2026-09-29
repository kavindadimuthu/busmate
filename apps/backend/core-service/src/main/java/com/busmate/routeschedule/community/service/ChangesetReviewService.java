package com.busmate.routeschedule.community.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.busmate.routeschedule.community.dto.ChangesetResponse;
import com.busmate.routeschedule.community.dto.ChangesetReviewResponse;
import com.busmate.routeschedule.community.dto.ContributorTrackRecord;
import com.busmate.routeschedule.community.dto.RejectChangesetRequest;
import com.busmate.routeschedule.community.dto.ScheduleWorkingContext;
import com.busmate.routeschedule.community.dto.WorkingCorrectionRequest;
import com.busmate.routeschedule.community.dto.WorkingProposalRequest;
import com.busmate.routeschedule.community.entity.Affiliation;
import com.busmate.routeschedule.community.entity.Changeset;
import com.busmate.routeschedule.community.entity.ChangesetAction;
import com.busmate.routeschedule.community.entity.ChangesetEntityType;
import com.busmate.routeschedule.community.entity.ChangesetStatus;
import com.busmate.routeschedule.community.entity.Contributor;
import com.busmate.routeschedule.community.repository.ChangesetRepository;
import com.busmate.routeschedule.community.repository.ContributorRepository;
import com.busmate.routeschedule.scheduling.dto.request.CorrectWorkingRequest;
import com.busmate.routeschedule.scheduling.dto.request.ScheduleWorkingRequest;
import com.busmate.routeschedule.scheduling.entity.Schedule;
import com.busmate.routeschedule.scheduling.entity.ScheduleWorking;
import com.busmate.routeschedule.scheduling.repository.ScheduleWorkingRepository;
import com.busmate.routeschedule.scheduling.repository.ScheduleRepository;
import com.busmate.routeschedule.scheduling.service.ScheduleWorkingService;
import com.busmate.routeschedule.shared.dto.LocationDto;
import com.busmate.routeschedule.network.dto.request.StopRequest;
import com.busmate.routeschedule.network.dto.response.StopResponse;
import com.busmate.routeschedule.network.entity.Stop;
import com.busmate.routeschedule.network.mapper.StopMapper;
import com.busmate.routeschedule.network.repository.StopRepository;
import com.busmate.routeschedule.shared.exception.BadRequestException;
import com.busmate.routeschedule.shared.exception.ConflictException;
import com.busmate.routeschedule.shared.exception.ForbiddenException;
import com.busmate.routeschedule.shared.exception.ResourceNotFoundException;
import com.busmate.routeschedule.shared.provenance.Provenance;
import com.busmate.routeschedule.shared.provenance.SourceTier;
import com.busmate.routeschedule.shared.security.Caller;
import com.busmate.routeschedule.shared.util.GeoUtils;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

/**
 * Staff review of a stop changeset — approving it into the canonical stop, rejecting it, or
 * reverting a bad approval (INC-031, ADR-018).
 */
@Service
@RequiredArgsConstructor
public class ChangesetReviewService {

    /** The display credit on an approved record; the real identity lives only on the changeset
     * (which stays staff-visible) and in {@code Provenance.attributedUserId}, never in the public
     * stop response — the same boundary INC-028 drew for the same reason. */
    private static final String COMMUNITY_CREDIT_LABEL = "Community contributor";

    private final ChangesetRepository changesets;
    private final ContributorRepository contributors;
    private final StopRepository stops;
    private final StopMapper stopMapper;
    private final ObjectMapper objectMapper;
    private final ReviewAccess access;
    private final ScheduleWorkingService workings;
    private final ScheduleRepository schedules;
    private final ScheduleWorkingRepository workingsRepo;

    @Transactional(readOnly = true)
    public Page<ChangesetReviewResponse> queue(Caller caller, ChangesetEntityType entityType, ChangesetStatus status,
                                                UUID proposerUserId, String homeDistrict, Pageable pageable) {
        ReviewAccess.Reviewer reviewer = access.reviewer(caller);
        // A steward does not see who proposed a change (ADR-022), so they cannot filter by it either.
        UUID proposerFilter = reviewer.isStaff() ? proposerUserId : null;
        List<UUID> districtProposerIds = homeDistrict == null || homeDistrict.isBlank()
                ? null
                : contributors.findAll().stream()
                        .filter(c -> homeDistrict.equalsIgnoreCase(c.getHomeDistrict()))
                        .map(Contributor::getUserId)
                        .toList();
        if (districtProposerIds != null && districtProposerIds.isEmpty()) {
            return Page.empty(pageable);
        }
        if (reviewer.isStaff()) {
            return changesets.findReviewQueue(entityType, status, proposerFilter,
                    districtProposerIds, pageable).map(c -> toReviewResponse(c, false));
        }
        // Scope is derived per proposal (ADR-022), so a steward's queue is filtered before it is paged.
        // Pilot-scale by design; the ADR names the trigger for storing the corridor instead.
        List<Changeset> visible = changesets.findReviewQueue(entityType, status, null,
                        districtProposerIds, Pageable.unpaged()).getContent().stream()
                .filter(c -> !c.getProposerUserId().equals(reviewer.userId()))
                .filter(c -> access.inScope(reviewer, c))
                .toList();
        int from = (int) Math.min(pageable.getOffset(), visible.size());
        int to = Math.min(from + pageable.getPageSize(), visible.size());
        return new org.springframework.data.domain.PageImpl<>(
                visible.subList(from, to).stream().map(c -> toReviewResponse(c, true)).toList(),
                pageable, visible.size());
    }

    @Transactional(readOnly = true)
    public ChangesetReviewResponse get(Caller caller, UUID changesetId) {
        ReviewAccess.Reviewer reviewer = access.reviewer(caller);
        Changeset c = find(changesetId);
        access.requireInScope(reviewer, c);
        return toReviewResponse(c, !reviewer.isStaff());
    }

    @Transactional
    public ChangesetResponse approve(Caller staff, UUID changesetId) {
        ReviewAccess.Reviewer reviewer = access.reviewer(staff);
        Changeset c = find(changesetId);
        access.requireInScope(reviewer, c);
        requirePending(c);
        requireNotSelf(staff, c);
        if (c.getEntityType() == ChangesetEntityType.SCHEDULE_WORKING) {
            return approveWorking(staff, reviewer, c);
        }

        StopRequest request = deserialize(c);
        Stop stop;
        if (c.getAction() == ChangesetAction.CREATE) {
            requireNoDuplicateName(request, null);
            stop = stopMapper.toEntity(request);
            creditContributor(stop, c);
            stop.setCreatedBy(staff.auditId());
            stop.setUpdatedBy(staff.auditId());
            stop = stops.save(stop);
        } else {
            stop = stops.findById(c.getTargetId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "The stop this proposal was against no longer exists"));
            requireNotStale(stop, c);
            requireDoesNotOutrankCommunity(stop);
            // A proposal stored before INC-043 can still carry nulls for fields its form never showed.
            request = objectMapper.convertValue(StopCorrectionMerge.fillGaps(
                    c.getProposedValues(), objectMapper.valueToTree(stopMapper.toResponse(stop))), StopRequest.class);
            if (nameChanged(stop, request)) {
                requireNoDuplicateNameOnRename(stop, request);
            }
            snapshotPreviousProvenance(c, stop);
            stopMapper.updateEntityFromRequest(request, stop);
            creditContributor(stop, c);
            stop.setUpdatedBy(staff.auditId());
            stop = stops.saveAndFlush(stop);
            c.setAppliedVersion(stop.getVersion());
        }

        c.setStatus(ChangesetStatus.APPROVED);
        c.setDecidedBy(staff.userId());
        c.setDecidedAt(Instant.now());
        return toResponse(changesets.save(c), !reviewer.isStaff());
    }

    @Transactional
    public ChangesetResponse reject(Caller staff, UUID changesetId, RejectChangesetRequest request) {
        ReviewAccess.Reviewer reviewer = access.reviewer(staff);
        Changeset c = find(changesetId);
        access.requireInScope(reviewer, c);
        requirePending(c);
        requireNotSelf(staff, c);

        if (!request.getReason().appliesTo(c.getEntityType())) {
            throw new BadRequestException("That reason doesn't apply to this kind of proposal");
        }
        c.setStatus(ChangesetStatus.REJECTED);
        c.setDecidedBy(staff.userId());
        c.setDecidedAt(Instant.now());
        String note = request.getNote() == null ? "" : request.getNote().strip();
        c.setDecisionReason(request.getReason().label(c.getEntityType()) + (note.isEmpty() ? "" : ": " + note));
        return toResponse(changesets.save(c), !reviewer.isStaff());
    }

    @Transactional
    public ChangesetResponse revert(Caller staff, UUID changesetId) {
        if (!staff.isStaff()) {
            throw new ForbiddenException("Only staff can revert an approval");
        }
        Changeset c = find(changesetId);
        if (c.getEntityType() == ChangesetEntityType.SCHEDULE_WORKING) {
            throw new ConflictException("An approved working can't be reverted here — remove it from the schedule's workings instead");
        }
        if (c.getStatus() != ChangesetStatus.APPROVED) {
            throw new ConflictException("Only an approved stop proposal can be reverted");
        }
        if (c.getAction() != ChangesetAction.UPDATE) {
            throw new ConflictException("Reverting a new stop isn't supported yet — delete it directly if needed");
        }

        Stop stop = stops.findById(c.getTargetId())
                .orElseThrow(() -> new ResourceNotFoundException("The stop this approval changed no longer exists"));
        if (!stop.getVersion().equals(c.getAppliedVersion())) {
            throw new ConflictException("This stop has changed since it was approved — revert is refused");
        }

        StopResponse before = deserializeSnapshot(c);
        stop.setName(before.getName());
        stop.setNameSinhala(before.getNameSinhala());
        stop.setNameTamil(before.getNameTamil());
        stop.setDescription(before.getDescription());
        stop.setIsAccessible(before.getIsAccessible());
        stop.setLocation(stopMapper.toStopLocation(before.getLocation()));

        Provenance restored = new Provenance();
        restored.setSourceTier(c.getPreviousSourceTier());
        restored.setObservedAt(c.getPreviousObservedAt());
        restored.setBaseConfidence(c.getPreviousBaseConfidence());
        restored.setAttributedUserId(c.getPreviousAttributedUserId());
        restored.setAttributionLabel(c.getPreviousAttributionLabel());
        stop.setProvenance(restored);
        stop.setUpdatedBy(staff.auditId());
        stops.save(stop);

        c.setStatus(ChangesetStatus.REVERTED);
        c.setRevertedBy(staff.userId());
        c.setRevertedAt(Instant.now());
        return toResponse(changesets.save(c));
    }

    /**
     * Writes a contributor's working through the same code staff use, so every rule staff face applies here.
     * A refusal (an overlap, say) propagates and rolls this back: the proposal stays pending, with the reason
     * given to the reviewer, who can reject it. It is recorded at SRC_4, dated to when it was seen (ADR-026).
     */
    private ChangesetResponse approveWorking(Caller staff, ReviewAccess.Reviewer reviewer, Changeset c) {
        if (c.getAction() == ChangesetAction.UPDATE) {
            return approveWorkingCorrection(staff, reviewer, c);
        }
        WorkingProposalRequest proposed = objectMapper.convertValue(c.getProposedValues(), WorkingProposalRequest.class);
        List<ScheduleWorkingRequest.VehicleClaim> vehicles = proposed.platesObserved() == null ? null
                : proposed.platesObserved().stream().filter(p -> p != null && !p.isBlank())
                        .map(p -> new ScheduleWorkingRequest.VehicleClaim(null, p.strip())).toList();
        workings.create(c.getTargetId(), new ScheduleWorkingRequest(
                null, null, null, proposed.operatorNameObserved(), proposed.serviceClass(),
                vehicles == null || vehicles.isEmpty() ? null : vehicles,
                SourceTier.SRC_4, COMMUNITY_CREDIT_LABEL, proposed.observedOn()), staff.auditId());

        c.setStatus(ChangesetStatus.APPROVED);
        c.setDecidedBy(staff.userId());
        c.setDecidedAt(Instant.now());
        return toResponse(changesets.save(c), !reviewer.isStaff());
    }

    /**
     * A correction to a working already on record, or that it has stopped (INC-058, ADR-027). Written through
     * the same staff capability {@link com.busmate.routeschedule.scheduling.controller.ScheduleWorkingController}
     * exposes directly, so every rule staff face applies here too.
     */
    private ChangesetResponse approveWorkingCorrection(Caller staff, ReviewAccess.Reviewer reviewer, Changeset c) {
        ScheduleWorking working = workingsRepo.findById(c.getTargetId())
                .orElseThrow(() -> new ResourceNotFoundException("The working this proposal was against no longer exists"));
        requireNotStale(working, c);
        WorkingCorrectionRequest proposed = objectMapper.convertValue(c.getProposedValues(), WorkingCorrectionRequest.class);
        workings.correct(c.getTargetId(), new CorrectWorkingRequest(
                proposed.operatorNameObserved(), proposed.platesObserved(), proposed.serviceClass(), proposed.effectiveEndDate()),
                staff.auditId());

        c.setStatus(ChangesetStatus.APPROVED);
        c.setDecidedBy(staff.userId());
        c.setDecidedAt(Instant.now());
        return toResponse(changesets.save(c), !reviewer.isStaff());
    }

    private ScheduleWorkingContext contextOf(Changeset c) {
        Schedule schedule = c.getAction() == ChangesetAction.UPDATE
                ? workingsRepo.findById(c.getTargetId()).map(ScheduleWorking::getSchedule).orElse(null)
                : schedules.findById(c.getTargetId()).orElse(null);
        if (schedule == null) {
            return null;
        }
        return new ScheduleWorkingContext(schedule.getId(), schedule.getName(),
                schedule.getRoute() != null ? schedule.getRoute().getName() : null,
                schedule.getRoute() != null ? schedule.getRoute().getRouteNumber() : null,
                workings.list(schedule.getId()));
    }

    // ───────────────────────────── helpers ─────────────────────────────

    private Changeset find(UUID id) {
        return changesets.findById(id).orElseThrow(() -> new ResourceNotFoundException("No proposal " + id));
    }

    private void requirePending(Changeset c) {
        if (c.getStatus() != ChangesetStatus.PENDING) {
            throw new ConflictException("This proposal has already been decided");
        }
    }

    private void requireNotSelf(Caller staff, Changeset c) {
        if (c.getProposerUserId().equals(staff.userId())) {
            throw new ForbiddenException("You can't decide on your own proposal");
        }
    }

    private void requireNotStale(Stop stop, Changeset c) {
        if (!stop.getVersion().equals(c.getTargetVersion())) {
            throw new ConflictException(
                    "This stop has changed since the proposal was made — reject it as outdated instead");
        }
    }

    private void requireNotStale(ScheduleWorking working, Changeset c) {
        if (!working.getVersion().equals(c.getTargetVersion())) {
            throw new ConflictException(
                    "This working has changed since the proposal was made — reject it as outdated instead");
        }
    }

    private void requireDoesNotOutrankCommunity(Stop stop) {
        SourceTier current = stop.getProvenance() != null ? stop.getProvenance().getSourceTier() : null;
        if (current != null && current.outranks(SourceTier.SRC_4)) {
            throw new ConflictException("This stop's data already outranks community observations ("
                    + current + ") and can't be applied through review — correct the stop directly if needed. "
                    + "The proposal stays here as a correction for you to consider.");
        }
    }

    private boolean nameChanged(Stop stop, StopRequest request) {
        return !java.util.Objects.equals(stop.getName(), request.getName())
                || !java.util.Objects.equals(stop.getNameSinhala(), request.getNameSinhala())
                || !java.util.Objects.equals(stop.getNameTamil(), request.getNameTamil());
    }

    /**
     * A rename is a duplicate only if a name it newly introduces is taken. Its unchanged variants are the
     * stop's own — the duplicate query has no way to exclude the stop itself — so they are not tested.
     */
    private void requireNoDuplicateNameOnRename(Stop stop, StopRequest request) {
        String name = java.util.Objects.equals(stop.getName(), request.getName()) ? null : request.getName();
        String sinhala = java.util.Objects.equals(stop.getNameSinhala(), request.getNameSinhala()) ? null : request.getNameSinhala();
        String tamil = java.util.Objects.equals(stop.getNameTamil(), request.getNameTamil()) ? null : request.getNameTamil();
        String city = cityOf(request);
        if (stops.existsByAnyNameVariantAndAnyCity(name, sinhala, tamil, city)) {
            throw new ConflictException("A stop with this name already exists in this city");
        }
    }

    private static String cityOf(StopRequest request) {
        return request.getLocation().getCity() != null ? request.getLocation().getCity()
                : request.getLocation().getCitySinhala() != null ? request.getLocation().getCitySinhala()
                : request.getLocation().getCityTamil();
    }

    private void requireNoDuplicateName(StopRequest request, UUID excludingStopId) {
        String city = request.getLocation().getCity() != null ? request.getLocation().getCity()
                : request.getLocation().getCitySinhala() != null ? request.getLocation().getCitySinhala()
                : request.getLocation().getCityTamil();
        if (stops.existsByAnyNameVariantAndAnyCity(request.getName(), request.getNameSinhala(),
                request.getNameTamil(), city)) {
            throw new ConflictException("A stop with this name already exists in this city");
        }
    }

    private void snapshotPreviousProvenance(Changeset c, Stop stop) {
        Provenance p = stop.getProvenance();
        if (p == null) {
            return;
        }
        c.setPreviousSourceTier(p.getSourceTier());
        c.setPreviousObservedAt(p.getObservedAt());
        c.setPreviousBaseConfidence(p.getBaseConfidence());
        c.setPreviousAttributedUserId(p.getAttributedUserId());
        c.setPreviousAttributionLabel(p.getAttributionLabel());
    }

    private void creditContributor(Stop stop, Changeset c) {
        Instant observedAt = c.getObservedOn() != null
                ? c.getObservedOn().atStartOfDay(ZoneOffset.UTC).toInstant()
                : Instant.now();
        stop.setProvenance(Provenance.of(SourceTier.SRC_4, COMMUNITY_CREDIT_LABEL, c.getProposerUserId(), observedAt));
    }

    private StopRequest deserialize(Changeset c) {
        return objectMapper.convertValue(c.getProposedValues(), StopRequest.class);
    }

    private StopResponse deserializeSnapshot(Changeset c) {
        return objectMapper.convertValue(c.getTargetSnapshot(), StopResponse.class);
    }

    private ChangesetReviewResponse toReviewResponse(Changeset c, boolean redactProposer) {
        if (c.getEntityType() == ChangesetEntityType.SCHEDULE_WORKING) {
            boolean staleWorking = false;
            if (c.getAction() == ChangesetAction.UPDATE) {
                ScheduleWorking targetEntity = workingsRepo.findById(c.getTargetId()).orElse(null);
                staleWorking = targetEntity != null && c.getStatus() == ChangesetStatus.PENDING
                        && !targetEntity.getVersion().equals(c.getTargetVersion());
            }
            return new ChangesetReviewResponse(toResponse(c, redactProposer), null, null, affiliationOf(c), trackRecordOf(c),
                    false, staleWorking, contextOf(c));
        }
        StopResponse currentStop = c.getTargetId() != null
                ? stops.findById(c.getTargetId()).map(stopMapper::toResponse).orElse(null)
                : null;

        Double distance = null;
        if (currentStop != null && currentStop.getLocation() != null) {
            LocationDto proposedLocation = deserialize(c).getLocation();
            if (proposedLocation.getLatitude() != null && proposedLocation.getLongitude() != null
                    && currentStop.getLocation().getLatitude() != null
                    && currentStop.getLocation().getLongitude() != null) {
                distance = GeoUtils.haversineMeters(proposedLocation.getLatitude(), proposedLocation.getLongitude(),
                        currentStop.getLocation().getLatitude(), currentStop.getLocation().getLongitude());
            }
        }

        Affiliation affiliation = affiliationOf(c);
        ContributorTrackRecord track = trackRecordOf(c);

        boolean outranks = false;
        boolean stale = false;
        if (c.getAction() == ChangesetAction.UPDATE) {
            Stop targetEntity = c.getTargetId() != null ? stops.findById(c.getTargetId()).orElse(null) : null;
            if (targetEntity != null) {
                SourceTier tier = targetEntity.getProvenance() != null ? targetEntity.getProvenance().getSourceTier() : null;
                outranks = tier != null && tier.outranks(SourceTier.SRC_4);
                stale = c.getStatus() == ChangesetStatus.PENDING
                        && !targetEntity.getVersion().equals(c.getTargetVersion());
            }
        }

        return new ChangesetReviewResponse(toResponse(c, redactProposer), currentStop, distance, affiliation, track, outranks, stale, null);
    }

    private Affiliation affiliationOf(Changeset c) {
        Contributor contributor = contributors.findById(c.getProposerUserId()).orElse(null);
        return contributor != null ? contributor.getAffiliation() : null;
    }

    private ContributorTrackRecord trackRecordOf(Changeset c) {
        return new ContributorTrackRecord(
                changesets.countByProposerUserIdAndStatus(c.getProposerUserId(), ChangesetStatus.APPROVED),
                changesets.countByProposerUserIdAndStatus(c.getProposerUserId(), ChangesetStatus.REJECTED),
                changesets.countByProposerUserIdAndStatus(c.getProposerUserId(), ChangesetStatus.REVERTED));
    }

    private ChangesetResponse toResponse(Changeset c) {
        return toResponse(c, false);
    }

    /** A steward's view withholds the proposer's identity (ADR-022). */
    private ChangesetResponse toResponse(Changeset c, boolean redactProposer) {
        return new ChangesetResponse(c.getId(), c.getEntityType(), c.getAction(), c.getTargetId(),
                c.getProposedValues(), c.getTargetSnapshot(), c.getObservedOn(), c.getObservationMethod(),
                c.getNote(), c.getStatus(), redactProposer ? null : c.getProposerUserId(), c.getCreatedAt(), c.getDecidedBy(),
                c.getDecidedAt(), c.getDecisionReason());
    }
}
