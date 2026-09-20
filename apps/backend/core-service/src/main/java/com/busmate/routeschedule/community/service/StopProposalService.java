package com.busmate.routeschedule.community.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.busmate.routeschedule.community.dto.ChangesetResponse;
import com.busmate.routeschedule.community.dto.DuplicateStopCandidate;
import com.busmate.routeschedule.community.dto.ProposeStopResponse;
import com.busmate.routeschedule.community.dto.StopProposalRequest;
import com.busmate.routeschedule.community.entity.Changeset;
import com.busmate.routeschedule.community.entity.ChangesetAction;
import com.busmate.routeschedule.community.entity.ChangesetEntityType;
import com.busmate.routeschedule.community.entity.ChangesetStatus;
import com.busmate.routeschedule.community.repository.ChangesetRepository;
import com.busmate.routeschedule.network.entity.Stop;
import com.busmate.routeschedule.network.mapper.StopMapper;
import com.busmate.routeschedule.network.repository.StopRepository;
import com.busmate.routeschedule.shared.exception.BadRequestException;
import com.busmate.routeschedule.shared.exception.ConflictException;
import com.busmate.routeschedule.shared.exception.ForbiddenException;
import com.busmate.routeschedule.shared.exception.ResourceNotFoundException;
import com.busmate.routeschedule.shared.security.Caller;
import com.busmate.routeschedule.shared.util.GeoUtils;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

/**
 * A contributor proposing a stop — new, or a correction to one that exists — and following their
 * own proposals (INC-030). Reviewing them is INC-031.
 */
@Service
@RequiredArgsConstructor
public class StopProposalService {

    /** Two proposals naming the same spot are "the same place" within this radius. */
    private static final double DUPLICATE_RADIUS_METERS = 50.0;

    private final ChangesetRepository changesets;
    private final StopRepository stops;
    private final StopMapper stopMapper;
    private final ContributorStanding standing;
    private final ObjectMapper objectMapper;

    @Value("${community.proposals.daily-cap:20}")
    private int dailyCap;

    @Transactional
    public ProposeStopResponse propose(Caller caller, StopProposalRequest request) {
        requireActiveContributor(caller);
        requireWithinSriLanka(request);
        requireUnderDailyCap(caller.userId());

        if (request.getTargetStopId() != null) {
            return new ProposeStopResponse(proposeUpdate(caller, request), null);
        }

        DuplicateStopCandidate duplicate = request.isConfirmDuplicate() ? null : findNearbyMatch(request);
        if (duplicate != null) {
            return new ProposeStopResponse(null, duplicate);
        }
        return new ProposeStopResponse(proposeCreate(caller, request), null);
    }

    private ChangesetResponse proposeCreate(Caller caller, StopProposalRequest request) {
        Changeset c = new Changeset();
        c.setEntityType(ChangesetEntityType.STOP);
        c.setAction(ChangesetAction.CREATE);
        c.setTargetId(null);
        c.setProposedValues(objectMapper.valueToTree(request));
        c.setTargetVersion(null);
        c.setTargetSnapshot(null);
        fillCommon(c, caller, request);
        return toResponse(changesets.save(c));
    }

    private ChangesetResponse proposeUpdate(Caller caller, StopProposalRequest request) {
        Stop target = stops.findById(request.getTargetStopId())
                .orElseThrow(() -> new ResourceNotFoundException("Stop not found: " + request.getTargetStopId()));

        if (changesets.findByProposerUserIdAndTargetIdAndStatus(caller.userId(), target.getId(), ChangesetStatus.PENDING)
                .isPresent()) {
            throw new ConflictException("You already have a pending proposal for this stop");
        }

        Changeset c = new Changeset();
        c.setEntityType(ChangesetEntityType.STOP);
        c.setAction(ChangesetAction.UPDATE);
        c.setTargetId(target.getId());
        c.setProposedValues(objectMapper.valueToTree(request));
        c.setTargetVersion(target.getVersion());
        c.setTargetSnapshot(objectMapper.valueToTree(stopMapper.toResponse(target)));
        fillCommon(c, caller, request);
        return toResponse(changesets.save(c));
    }

    private void fillCommon(Changeset c, Caller caller, StopProposalRequest request) {
        c.setObservedOn(request.getObservedOn());
        c.setObservationMethod(request.getObservationMethod());
        c.setNote(request.getNote());
        c.setStatus(ChangesetStatus.PENDING);
        c.setProposerUserId(caller.userId());
        c.setCreatedAt(Instant.now());
    }

    /** Stops within the duplicate radius whose name is a case-insensitive match or substring either way. */
    private DuplicateStopCandidate findNearbyMatch(StopProposalRequest request) {
        double lat = request.getLocation().getLatitude();
        double lng = request.getLocation().getLongitude();
        double latPad = GeoUtils.metersToLatitudeDegrees(DUPLICATE_RADIUS_METERS);
        double lngPad = GeoUtils.metersToLongitudeDegrees(DUPLICATE_RADIUS_METERS, lat);

        List<Stop> nearby = stops.findWithinBoundingBox(lat - latPad, lat + latPad, lng - lngPad, lng + lngPad);
        String proposedName = normalise(request.getName());

        return nearby.stream()
                .filter(s -> s.getLocation() != null && s.getLocation().getLatitude() != null
                        && s.getLocation().getLongitude() != null)
                .map(s -> new DuplicateStopCandidate(s.getId(), s.getName(),
                        GeoUtils.haversineMeters(lat, lng, s.getLocation().getLatitude(), s.getLocation().getLongitude())))
                .filter(candidate -> candidate.distanceMeters() <= DUPLICATE_RADIUS_METERS)
                .filter(candidate -> namesMatch(proposedName, normalise(candidate.name())))
                .min((a, b) -> Double.compare(a.distanceMeters(), b.distanceMeters()))
                .orElse(null);
    }

    /**
     * Two names are "similar enough to ask about" if one contains the other, or if their first
     * word matches — the common case for an abbreviation ("Nugegoda Jn" for "Nugegoda Junction"),
     * which a plain substring check misses because the abbreviated word doesn't even share a
     * prefix with the word it stands for.
     */
    private static boolean namesMatch(String a, String b) {
        if (a.isBlank() || b.isBlank()) {
            return false;
        }
        if (a.equals(b) || a.contains(b) || b.contains(a)) {
            return true;
        }
        String firstA = a.split(" ", 2)[0];
        String firstB = b.split(" ", 2)[0];
        return !firstA.isBlank() && firstA.equals(firstB);
    }

    private static String normalise(String name) {
        return name == null ? "" : name.strip().toLowerCase().replaceAll("\\s+", " ");
    }

    private void requireActiveContributor(Caller caller) {
        if (!standing.isActiveContributor(caller.userId())) {
            throw new ForbiddenException("Only active contributors may propose a stop");
        }
    }

    private void requireWithinSriLanka(StopProposalRequest request) {
        Double lat = request.getLocation() != null ? request.getLocation().getLatitude() : null;
        Double lng = request.getLocation() != null ? request.getLocation().getLongitude() : null;
        if (lat == null || lng == null
                || lat < StopProposalRequest.MIN_LATITUDE || lat > StopProposalRequest.MAX_LATITUDE
                || lng < StopProposalRequest.MIN_LONGITUDE || lng > StopProposalRequest.MAX_LONGITUDE) {
            throw new BadRequestException("That position looks like it's outside Sri Lanka — check the map pin");
        }
    }

    private void requireUnderDailyCap(UUID userId) {
        long today = changesets.countByProposerUserIdAndEntityTypeAndCreatedAtAfter(
                userId, ChangesetEntityType.STOP, Instant.now().truncatedTo(ChronoUnit.DAYS));
        if (today >= dailyCap) {
            throw new ConflictException("You've reached today's limit of " + dailyCap + " proposals — try again tomorrow");
        }
    }

    // ───────────────────────────── the contributor's own proposals ─────────────────────────────

    @Transactional(readOnly = true)
    public Page<ChangesetResponse> mine(Caller caller, ChangesetStatus status, Pageable pageable) {
        Page<Changeset> page = status == null
                ? changesets.findByProposerUserIdOrderByCreatedAtDesc(caller.userId(), pageable)
                : changesets.findByProposerUserIdAndStatusOrderByCreatedAtDesc(caller.userId(), status, pageable);
        return page.map(this::toResponse);
    }

    @Transactional
    public ChangesetResponse withdraw(Caller caller, UUID changesetId) {
        Changeset c = changesets.findById(changesetId)
                .orElseThrow(() -> new ResourceNotFoundException("No proposal " + changesetId));
        if (!c.getProposerUserId().equals(caller.userId())) {
            throw new ForbiddenException("You can only withdraw your own proposal");
        }
        if (c.getStatus() != ChangesetStatus.PENDING) {
            throw new ConflictException("Only a pending proposal can be withdrawn");
        }
        c.setStatus(ChangesetStatus.WITHDRAWN);
        return toResponse(c);
    }

    ChangesetResponse toResponse(Changeset c) {
        return new ChangesetResponse(c.getId(), c.getEntityType(), c.getAction(), c.getTargetId(),
                c.getProposedValues(), c.getTargetSnapshot(), c.getObservedOn(), c.getObservationMethod(),
                c.getNote(), c.getStatus(), c.getProposerUserId(), c.getCreatedAt(), c.getDecidedBy(),
                c.getDecidedAt(), c.getDecisionReason());
    }
}
