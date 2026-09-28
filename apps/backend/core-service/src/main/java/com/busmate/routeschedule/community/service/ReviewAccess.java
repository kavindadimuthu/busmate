package com.busmate.routeschedule.community.service;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.busmate.routeschedule.shared.exception.ForbiddenException;
import com.busmate.routeschedule.community.entity.Changeset;
import com.busmate.routeschedule.community.entity.ChangesetAction;
import com.busmate.routeschedule.community.entity.ChangesetEntityType;
import com.busmate.routeschedule.community.entity.Contributor;
import com.busmate.routeschedule.community.repository.ContributorRepository;
import com.busmate.routeschedule.network.repository.RouteStopRepository;
import com.busmate.routeschedule.scheduling.repository.ScheduleRepository;
import com.busmate.routeschedule.scheduling.repository.ScheduleWorkingRepository;
import com.busmate.routeschedule.shared.security.Caller;

import lombok.RequiredArgsConstructor;

/**
 * Who may review a proposal, and where (ADR-022). Staff review anything; a steward reviews proposals
 * inside their corridors; everyone else is refused. Asked on every request, never cached, and fails
 * closed: a proposal that matches no corridor is staff-only.
 */
@Component
@RequiredArgsConstructor
public class ReviewAccess {

    /** {@code scope} is null for staff (unrestricted) and the steward's route groups otherwise. */
    public record Reviewer(UUID userId, Set<UUID> scope) {
        public boolean isStaff() {
            return scope == null;
        }
    }

    private final ContributorRepository contributors;
    private final ContributorStanding standing;
    private final RouteStopRepository routeStops;
    private final ScheduleRepository schedules;
    private final ScheduleWorkingRepository workings;

    @Transactional(readOnly = true)
    public Reviewer reviewer(Caller caller) {
        if (caller.isStaff()) {
            return new Reviewer(caller.userId(), null);
        }
        Contributor row = caller.userId() == null ? null : contributors.findById(caller.userId()).orElse(null);
        if (row == null || !standing.isActiveSteward(row)) {
            throw new ForbiddenException("Only staff and stewards can review proposals");
        }
        return new Reviewer(caller.userId(), Set.copyOf(row.getStewardScopeRouteGroupIds()));
    }

    @Transactional(readOnly = true)
    public boolean inScope(Reviewer reviewer, Changeset c) {
        if (reviewer.isStaff()) {
            return true;
        }
        return !Collections.disjoint(reviewer.scope(), corridorsOf(c));
    }

    public void requireInScope(Reviewer reviewer, Changeset c) {
        if (!inScope(reviewer, c)) {
            throw new ForbiddenException("This proposal is outside the corridors you review");
        }
    }

    /**
     * Route groups a proposal belongs to: for a stop, what serves it or its proposer's declared corridors; for
     * a working, its schedule's route group — reached directly for a new working (the target is the schedule
     * itself) or through the working for a correction (the target is the working; INC-058).
     */
    private Set<UUID> corridorsOf(Changeset c) {
        if (c.getEntityType() == ChangesetEntityType.SCHEDULE_WORKING) {
            // A route with no group has no corridor, so it is staff-only either way.
            var routeGroup = c.getAction() == ChangesetAction.UPDATE
                    ? workings.findById(c.getTargetId()).map(w -> w.getSchedule().getRoute().getRouteGroup())
                    : schedules.findById(c.getTargetId()).map(s -> s.getRoute().getRouteGroup());
            return routeGroup.map(g -> new HashSet<>(Set.of(g.getId()))).orElseGet(HashSet::new);
        }
        if (c.getAction() == ChangesetAction.UPDATE && c.getTargetId() != null) {
            return new HashSet<>(routeStops.findRouteGroupIdsByStopId(c.getTargetId()));
        }
        return contributors.findById(c.getProposerUserId())
                .map(Contributor::getCorridorRouteGroupIds)
                .<Set<UUID>>map(HashSet::new)
                .orElseGet(HashSet::new);
    }
}
