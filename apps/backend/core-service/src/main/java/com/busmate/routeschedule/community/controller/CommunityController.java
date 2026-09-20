package com.busmate.routeschedule.community.controller;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.busmate.routeschedule.community.dto.AgreementAcceptanceRequest;
import com.busmate.routeschedule.community.dto.ChangesetResponse;
import com.busmate.routeschedule.community.dto.ProposeStopResponse;
import com.busmate.routeschedule.community.dto.StopProposalRequest;
import com.busmate.routeschedule.community.entity.ChangesetStatus;
import com.busmate.routeschedule.community.service.StopProposalService;
import com.busmate.routeschedule.community.dto.ContributorAgreementResponse;
import com.busmate.routeschedule.community.dto.ContributorApplicationRequest;
import com.busmate.routeschedule.community.dto.ContributorCountsResponse;
import com.busmate.routeschedule.community.dto.ContributorDecisionRequest;
import com.busmate.routeschedule.community.dto.ContributorResponse;
import com.busmate.routeschedule.community.dto.MyContributorStandingResponse;
import com.busmate.routeschedule.community.entity.ContributorStatus;
import com.busmate.routeschedule.community.service.ContributorService;
import com.busmate.routeschedule.shared.security.CallerContext;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** The contributor programme: applying (passengers) and deciding (MOT and admin). INC-029. */
@RestController
@RequestMapping("/api/community")
@RequiredArgsConstructor
@Tag(name = "11. Community Contributors", description = "Applying to contribute network data, and staff decisions on applications")
public class CommunityController {

    private final ContributorService service;
    private final StopProposalService stopProposals;
    private final CallerContext callerContext;

    @GetMapping("/agreement")
    @Operation(summary = "The contributor agreement in force", operationId = "getContributorAgreement")
    public ContributorAgreementResponse agreement() {
        return service.agreement();
    }

    @GetMapping("/me")
    @Operation(summary = "Where the signed-in user stands in the contributor programme", operationId = "getMyContributorStanding")
    public MyContributorStandingResponse me() {
        return service.myStanding(callerContext.require());
    }

    @PostMapping("/applications")
    @Operation(summary = "Apply to become a contributor (passengers with a verified email)", operationId = "applyToContribute")
    public ResponseEntity<ContributorResponse> apply(@Valid @RequestBody ContributorApplicationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.apply(callerContext.require(), request));
    }

    @PostMapping("/me/agreement")
    @Operation(summary = "Accept the contributor agreement now in force", operationId = "acceptContributorAgreement")
    public ContributorResponse acceptAgreement(@Valid @RequestBody AgreementAcceptanceRequest request) {
        return service.acceptAgreement(callerContext.require(), request.getAgreementVersion());
    }

    // ───────────────────────────── staff ─────────────────────────────

    @GetMapping("/contributors")
    @PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
    @Operation(summary = "List contributors and applications, oldest application first", operationId = "listContributors")
    public Page<ContributorResponse> list(@RequestParam(required = false) ContributorStatus status,
                                          @RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "20") int size) {
        return service.list(status, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by("appliedAt").ascending()));
    }

    @GetMapping("/contributors/counts")
    @PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
    @Operation(summary = "How many contributors are in each status", operationId = "countContributors")
    public ContributorCountsResponse counts() {
        return service.counts();
    }

    @GetMapping("/contributors/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
    @Operation(summary = "One contributor or application", operationId = "getContributor")
    public ContributorResponse get(@PathVariable UUID userId) {
        return service.get(userId);
    }

    @PostMapping("/contributors/{userId}/accept")
    @PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
    @Operation(summary = "Accept an application", operationId = "acceptContributor")
    public ContributorResponse accept(@PathVariable UUID userId) {
        return service.accept(callerContext.require(), userId);
    }

    @PostMapping("/contributors/{userId}/decline")
    @PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
    @Operation(summary = "Decline an application; the reason is shown to the applicant", operationId = "declineContributor")
    public ContributorResponse decline(@PathVariable UUID userId, @Valid @RequestBody ContributorDecisionRequest request) {
        return service.decline(callerContext.require(), userId, request.getReason());
    }

    @PostMapping("/contributors/{userId}/suspend")
    @PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
    @Operation(summary = "Suspend an active contributor; takes effect on their next request", operationId = "suspendContributor")
    public ContributorResponse suspend(@PathVariable UUID userId, @Valid @RequestBody ContributorDecisionRequest request) {
        return service.suspend(callerContext.require(), userId, request.getReason());
    }

    @PostMapping("/contributors/{userId}/reinstate")
    @PreAuthorize("hasAnyRole('ADMIN', 'MOT')")
    @Operation(summary = "Reinstate a suspended contributor", operationId = "reinstateContributor")
    public ContributorResponse reinstate(@PathVariable UUID userId) {
        return service.reinstate(callerContext.require(), userId);
    }

    // ───────────────────────────── stop proposals (INC-030) ─────────────────────────────

    @PostMapping("/stop-proposals")
    @Operation(summary = "Propose a new stop or a correction to one (active contributors only)", operationId = "proposeStop")
    public ResponseEntity<ProposeStopResponse> proposeStop(@Valid @RequestBody StopProposalRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(stopProposals.propose(callerContext.require(), request));
    }

    @GetMapping("/changesets/mine")
    @Operation(summary = "The signed-in user's own proposals, newest first", operationId = "listMyChangesets")
    public Page<ChangesetResponse> mine(@RequestParam(required = false) ChangesetStatus status,
                                        @RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "20") int size) {
        return stopProposals.mine(callerContext.require(), status, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100)));
    }

    @PostMapping("/changesets/{changesetId}/withdraw")
    @Operation(summary = "Withdraw one of the signed-in user's own pending proposals", operationId = "withdrawChangeset")
    public ChangesetResponse withdraw(@PathVariable UUID changesetId) {
        return stopProposals.withdraw(callerContext.require(), changesetId);
    }
}
