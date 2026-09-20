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
import com.busmate.routeschedule.community.entity.Affiliation;
import com.busmate.routeschedule.community.entity.Changeset;
import com.busmate.routeschedule.community.entity.ChangesetAction;
import com.busmate.routeschedule.community.entity.ChangesetEntityType;
import com.busmate.routeschedule.community.entity.ChangesetStatus;
import com.busmate.routeschedule.community.entity.Contributor;
import com.busmate.routeschedule.community.repository.ChangesetRepository;
import com.busmate.routeschedule.community.repository.ContributorRepository;
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

    @Transactional(readOnly = true)
    public Page<ChangesetReviewResponse> queue(ChangesetStatus status, UUID proposerUserId, String homeDistrict,
                                                Pageable pageable) {
        List<UUID> districtProposerIds = homeDistrict == null || homeDistrict.isBlank()
                ? null
                : contributors.findAll().stream()
                        .filter(c -> homeDistrict.equalsIgnoreCase(c.getHomeDistrict()))
                        .map(Contributor::getUserId)
                        .toList();
        if (districtProposerIds != null && districtProposerIds.isEmpty()) {
            return Page.empty(pageable);
        }
        Page<Changeset> page = changesets.findReviewQueue(ChangesetEntityType.STOP, status, proposerUserId,
                districtProposerIds, pageable);
        return page.map(this::toReviewResponse);
    }

    @Transactional(readOnly = true)
    public ChangesetReviewResponse get(UUID changesetId) {
        return toReviewResponse(find(changesetId));
    }

    @Transactional
    public ChangesetResponse approve(Caller staff, UUID changesetId) {
        Changeset c = find(changesetId);
        requireStopPending(c);
        requireNotSelf(staff, c);

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
            if (nameChanged(stop, request)) {
                requireNoDuplicateName(request, null);
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
        return toResponse(changesets.save(c));
    }

    @Transactional
    public ChangesetResponse reject(Caller staff, UUID changesetId, RejectChangesetRequest request) {
        Changeset c = find(changesetId);
        requireStopPending(c);
        requireNotSelf(staff, c);

        c.setStatus(ChangesetStatus.REJECTED);
        c.setDecidedBy(staff.userId());
        c.setDecidedAt(Instant.now());
        String note = request.getNote() == null ? "" : request.getNote().strip();
        c.setDecisionReason(request.getReason().label() + (note.isEmpty() ? "" : ": " + note));
        return toResponse(changesets.save(c));
    }

    @Transactional
    public ChangesetResponse revert(Caller staff, UUID changesetId) {
        Changeset c = find(changesetId);
        if (c.getEntityType() != ChangesetEntityType.STOP || c.getStatus() != ChangesetStatus.APPROVED) {
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

    // ───────────────────────────── helpers ─────────────────────────────

    private Changeset find(UUID id) {
        return changesets.findById(id).orElseThrow(() -> new ResourceNotFoundException("No proposal " + id));
    }

    private void requireStopPending(Changeset c) {
        if (c.getEntityType() != ChangesetEntityType.STOP) {
            throw new BadRequestException("Only stop proposals can be reviewed today");
        }
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

    private ChangesetReviewResponse toReviewResponse(Changeset c) {
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

        Contributor contributor = contributors.findById(c.getProposerUserId()).orElse(null);
        Affiliation affiliation = contributor != null ? contributor.getAffiliation() : null;
        ContributorTrackRecord track = new ContributorTrackRecord(
                changesets.countByProposerUserIdAndStatus(c.getProposerUserId(), ChangesetStatus.APPROVED),
                changesets.countByProposerUserIdAndStatus(c.getProposerUserId(), ChangesetStatus.REJECTED));

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

        return new ChangesetReviewResponse(toResponse(c), currentStop, distance, affiliation, track, outranks, stale);
    }

    private ChangesetResponse toResponse(Changeset c) {
        return new ChangesetResponse(c.getId(), c.getEntityType(), c.getAction(), c.getTargetId(),
                c.getProposedValues(), c.getTargetSnapshot(), c.getObservedOn(), c.getObservationMethod(),
                c.getNote(), c.getStatus(), c.getProposerUserId(), c.getCreatedAt(), c.getDecidedBy(),
                c.getDecidedAt(), c.getDecisionReason());
    }
}
