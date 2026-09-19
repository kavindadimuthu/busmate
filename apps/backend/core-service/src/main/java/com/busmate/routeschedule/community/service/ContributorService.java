package com.busmate.routeschedule.community.service;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.busmate.routeschedule.community.dto.ContributorAgreementResponse;
import com.busmate.routeschedule.community.dto.ContributorApplicationRequest;
import com.busmate.routeschedule.community.dto.ContributorCountsResponse;
import com.busmate.routeschedule.community.dto.ContributorResponse;
import com.busmate.routeschedule.community.dto.MyContributorStandingResponse;
import com.busmate.routeschedule.community.dto.MyContributorStandingResponse.CannotApplyReason;
import com.busmate.routeschedule.community.entity.Affiliation;
import com.busmate.routeschedule.community.entity.Contributor;
import com.busmate.routeschedule.community.entity.ContributorStatus;
import com.busmate.routeschedule.community.repository.ContributorRepository;
import com.busmate.routeschedule.network.repository.RouteGroupRepository;
import com.busmate.routeschedule.shared.client.AccountDirectory;
import com.busmate.routeschedule.shared.exception.BadRequestException;
import com.busmate.routeschedule.shared.exception.ConflictException;
import com.busmate.routeschedule.shared.exception.ForbiddenException;
import com.busmate.routeschedule.shared.exception.ResourceNotFoundException;
import com.busmate.routeschedule.shared.security.Caller;

import lombok.RequiredArgsConstructor;

/**
 * Applying to contribute and staff decisions on it (INC-029, ADR-019).
 *
 * <pre>
 *   (none) ──apply──▶ APPLIED ──accept──▶ ACTIVE ──suspend──▶ SUSPENDED
 *                        │                   ▲                   │
 *                     decline                └────reinstate──────┘
 *                        ▼
 *                    DECLINED ──apply again──▶ APPLIED
 * </pre>
 */
@Service
@RequiredArgsConstructor
public class ContributorService {

    private final ContributorRepository contributors;
    private final RouteGroupRepository routeGroups;
    private final ContributorAgreement agreement;
    private final ContributorStanding standing;
    private final AccountDirectory accounts;

    public ContributorAgreementResponse agreement() {
        return new ContributorAgreementResponse(agreement.version(), agreement.isDraft(), agreement.text());
    }

    // ───────────────────────────── the applicant ─────────────────────────────

    @Transactional(readOnly = true)
    public MyContributorStandingResponse myStanding(Caller caller) {
        Contributor row = contributors.findById(caller.userId()).orElse(null);
        CannotApplyReason reason = cannotApplyReason(caller, row);
        return new MyContributorStandingResponse(
                row == null ? "NONE" : row.getStatus().name(),
                row != null && standing.isActive(row),
                reason == null,
                reason,
                row == null ? null : toResponse(row));
    }

    @Transactional
    public ContributorResponse apply(Caller caller, ContributorApplicationRequest request) {
        Contributor row = contributors.findById(caller.userId()).orElse(null);
        CannotApplyReason reason = cannotApplyReason(caller, row);
        if (reason != null) {
            throw refusal(reason);
        }
        requireCurrentAgreement(request.getAgreementVersion());
        if (request.getAffiliation() != Affiliation.NONE && isBlank(request.getAffiliationDetail())) {
            throw new BadRequestException("Tell us which operator you are linked to and how");
        }
        Set<UUID> corridors = request.getCorridorRouteGroupIds() == null ? Set.of() : request.getCorridorRouteGroupIds();
        long known = corridors.isEmpty() ? 0 : routeGroups.findAllById(corridors).size();
        if (known != corridors.size()) {
            throw new BadRequestException("One of the chosen corridors does not exist");
        }

        if (row == null) {
            row = new Contributor();
            row.setUserId(caller.userId());
        }
        Instant now = Instant.now();
        row.setStatus(ContributorStatus.APPLIED);
        row.setMotivation(request.getMotivation().strip());
        row.setHomeDistrict(blankToNull(request.getHomeDistrict()));
        row.setCorridorRouteGroupIds(new HashSet<>(corridors));
        row.setAffiliation(request.getAffiliation());
        row.setAffiliationDetail(request.getAffiliation() == Affiliation.NONE ? null : request.getAffiliationDetail().strip());
        row.setAgreementVersion(agreement.version());
        row.setAgreementAcceptedAt(now);
        row.setAppliedAt(now);
        // A fresh application is a fresh start: the previous decline no longer describes it.
        row.setDecidedBy(null);
        row.setDecidedAt(null);
        row.setDecisionReason(null);
        return toResponse(contributors.save(row));
    }

    /** An applicant or contributor accepting the agreement now in force, after it changed. */
    @Transactional
    public ContributorResponse acceptAgreement(Caller caller, String version) {
        Contributor row = contributors.findById(caller.userId())
                .orElseThrow(() -> new ConflictException("You have not applied to contribute"));
        if (row.getStatus() != ContributorStatus.ACTIVE && row.getStatus() != ContributorStatus.APPLIED) {
            throw new ConflictException("Only applicants and active contributors accept the agreement");
        }
        requireCurrentAgreement(version);
        row.setAgreementVersion(agreement.version());
        row.setAgreementAcceptedAt(Instant.now());
        return toResponse(row);
    }

    private CannotApplyReason cannotApplyReason(Caller caller, Contributor row) {
        if (!caller.hasRole(Caller.PASSENGER)) {
            return CannotApplyReason.NOT_A_PASSENGER;
        }
        if (row != null) {
            switch (row.getStatus()) {
                case APPLIED: return CannotApplyReason.ALREADY_APPLIED;
                case ACTIVE: return CannotApplyReason.ALREADY_CONTRIBUTOR;
                case SUSPENDED: return CannotApplyReason.SUSPENDED;
                case DECLINED: break; // may apply again
            }
        }
        AccountDirectory.Account account = accounts.find(caller.userId()).orElse(null);
        if (account == null || !"active".equals(account.accountStatus())) {
            return CannotApplyReason.ACCOUNT_NOT_ACTIVE;
        }
        if (!Boolean.TRUE.equals(account.emailVerified())) {
            return CannotApplyReason.EMAIL_NOT_VERIFIED;
        }
        return null;
    }

    private static RuntimeException refusal(CannotApplyReason reason) {
        return switch (reason) {
            case NOT_A_PASSENGER -> new ForbiddenException("Only passenger accounts can apply to contribute");
            case EMAIL_NOT_VERIFIED -> new ForbiddenException("Verify your email address before applying");
            case ACCOUNT_NOT_ACTIVE -> new ForbiddenException("Your account is not active");
            case ALREADY_APPLIED -> new ConflictException("Your application is already being reviewed");
            case ALREADY_CONTRIBUTOR -> new ConflictException("You are already a contributor");
            case SUSPENDED -> new ConflictException("Your contributor access is suspended");
        };
    }

    private void requireCurrentAgreement(String version) {
        if (!agreement.version().equals(version)) {
            throw new ConflictException("The contributor agreement has changed; please read the current version");
        }
    }

    // ───────────────────────────── staff ─────────────────────────────

    @Transactional(readOnly = true)
    public Page<ContributorResponse> list(ContributorStatus status, Pageable pageable) {
        Page<Contributor> page = status == null ? contributors.findAll(pageable) : contributors.findByStatus(status, pageable);
        return page.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public ContributorCountsResponse counts() {
        return new ContributorCountsResponse(
                contributors.countByStatus(ContributorStatus.APPLIED),
                contributors.countByStatus(ContributorStatus.ACTIVE),
                contributors.countByStatus(ContributorStatus.DECLINED),
                contributors.countByStatus(ContributorStatus.SUSPENDED));
    }

    @Transactional(readOnly = true)
    public ContributorResponse get(UUID userId) {
        return toResponse(find(userId));
    }

    @Transactional
    public ContributorResponse accept(Caller staff, UUID userId) {
        if (!agreement.permitsAcceptance()) {
            throw new ConflictException("The contributor agreement is still a draft. Nobody can be accepted until the "
                    + "approved agreement is in place.");
        }
        return decide(staff, userId, ContributorStatus.APPLIED, ContributorStatus.ACTIVE, null, false);
    }

    @Transactional
    public ContributorResponse decline(Caller staff, UUID userId, String reason) {
        return decide(staff, userId, ContributorStatus.APPLIED, ContributorStatus.DECLINED, reason, true);
    }

    @Transactional
    public ContributorResponse suspend(Caller staff, UUID userId, String reason) {
        return decide(staff, userId, ContributorStatus.ACTIVE, ContributorStatus.SUSPENDED, reason, true);
    }

    @Transactional
    public ContributorResponse reinstate(Caller staff, UUID userId) {
        return decide(staff, userId, ContributorStatus.SUSPENDED, ContributorStatus.ACTIVE, null, false);
    }

    private ContributorResponse decide(Caller staff, UUID userId, ContributorStatus from, ContributorStatus to,
                                       String reason, boolean reasonRequired) {
        Contributor row = find(userId);
        if (row.getStatus() != from) {
            throw new ConflictException("This contributor is " + row.getStatus().name().toLowerCase()
                    + ", so they cannot be moved to " + to.name().toLowerCase());
        }
        if (reasonRequired && isBlank(reason)) {
            throw new BadRequestException("Give a reason; the applicant will see it");
        }
        row.setStatus(to);
        row.setDecidedBy(staff.userId());
        row.setDecidedAt(Instant.now());
        row.setDecisionReason(reasonRequired ? reason.strip() : null);
        return toResponse(row);
    }

    private Contributor find(UUID userId) {
        return contributors.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No contributor application for " + userId));
    }

    ContributorResponse toResponse(Contributor c) {
        return new ContributorResponse(c.getUserId(), c.getStatus(), c.getLevel(), c.getMotivation(),
                c.getHomeDistrict(), Set.copyOf(c.getCorridorRouteGroupIds()), c.getAffiliation(),
                c.getAffiliationDetail(), c.getAgreementVersion(), agreement.version().equals(c.getAgreementVersion()),
                c.getAgreementAcceptedAt(), c.getAppliedAt(), c.getDecidedBy(), c.getDecidedAt(), c.getDecisionReason());
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private static String blankToNull(String s) {
        return isBlank(s) ? null : s.strip();
    }
}
