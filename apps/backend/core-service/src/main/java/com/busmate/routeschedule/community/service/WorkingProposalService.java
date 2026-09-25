package com.busmate.routeschedule.community.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.busmate.routeschedule.community.dto.ChangesetResponse;
import com.busmate.routeschedule.community.dto.WorkingProposalRequest;
import com.busmate.routeschedule.community.entity.Changeset;
import com.busmate.routeschedule.community.entity.ChangesetAction;
import com.busmate.routeschedule.community.entity.ChangesetEntityType;
import com.busmate.routeschedule.community.entity.ChangesetStatus;
import com.busmate.routeschedule.community.repository.ChangesetRepository;
import com.busmate.routeschedule.scheduling.repository.ScheduleRepository;
import com.busmate.routeschedule.shared.exception.BadRequestException;
import com.busmate.routeschedule.shared.exception.ConflictException;
import com.busmate.routeschedule.shared.exception.ForbiddenException;
import com.busmate.routeschedule.shared.exception.ResourceNotFoundException;
import com.busmate.routeschedule.shared.security.Caller;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

/**
 * A contributor proposes who usually works a departure (ADR-026, INC-052). It waits in the review queue like a
 * stop proposal; approval, rejection and withdrawal share that machinery. Nothing is written to the schedule here.
 */
@Service
@RequiredArgsConstructor
public class WorkingProposalService {

    private final ChangesetRepository changesets;
    private final ScheduleRepository schedules;
    private final ContributorStanding standing;
    private final ObjectMapper objectMapper;
    private final StopProposalService responses;

    @Value("${community.proposals.daily-cap:20}")
    private int dailyCap;

    @Transactional
    public ChangesetResponse propose(Caller caller, WorkingProposalRequest request) {
        if (!standing.isActiveContributor(caller.userId())) {
            throw new ForbiddenException("Only active contributors may propose who works a departure");
        }
        if (!hasSomethingToSay(request)) {
            throw new BadRequestException("Say something about who works it: an operator, a plate or a service class");
        }
        if (!schedules.existsById(request.scheduleId())) {
            throw new ResourceNotFoundException("Schedule not found: " + request.scheduleId());
        }
        if (changesets.countByProposerUserIdAndCreatedAtAfter(caller.userId(), Instant.now().truncatedTo(ChronoUnit.DAYS)) >= dailyCap) {
            throw new ConflictException("You've reached today's limit of " + dailyCap + " proposals — try again tomorrow");
        }
        if (changesets.findByProposerUserIdAndTargetIdAndStatus(caller.userId(), request.scheduleId(), ChangesetStatus.PENDING).isPresent()) {
            throw new ConflictException("You already have a pending proposal for this departure");
        }

        Changeset c = new Changeset();
        c.setEntityType(ChangesetEntityType.SCHEDULE_WORKING);
        c.setAction(ChangesetAction.CREATE);
        c.setTargetId(request.scheduleId()); // the parent: the working does not exist yet
        c.setProposedValues(objectMapper.valueToTree(request));
        c.setObservedOn(request.observedOn());
        c.setObservationMethod(request.observationMethod());
        c.setNote(request.note());
        c.setStatus(ChangesetStatus.PENDING);
        c.setProposerUserId(caller.userId());
        c.setCreatedAt(Instant.now());
        return responses.toResponse(changesets.save(c));
    }

    private static boolean hasSomethingToSay(WorkingProposalRequest r) {
        List<String> plates = r.platesObserved();
        return (r.operatorNameObserved() != null && !r.operatorNameObserved().isBlank())
                || (plates != null && plates.stream().anyMatch(p -> p != null && !p.isBlank()))
                || r.serviceClass() != null;
    }
}
