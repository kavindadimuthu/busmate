/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgreementAcceptanceRequest } from '../models/AgreementAcceptanceRequest';
import type { ChangesetResponse } from '../models/ChangesetResponse';
import type { ChangesetReviewResponse } from '../models/ChangesetReviewResponse';
import type { ContributorAgreementResponse } from '../models/ContributorAgreementResponse';
import type { ContributorApplicationRequest } from '../models/ContributorApplicationRequest';
import type { ContributorCountsResponse } from '../models/ContributorCountsResponse';
import type { ContributorDecisionRequest } from '../models/ContributorDecisionRequest';
import type { ContributorResponse } from '../models/ContributorResponse';
import type { MyContributorStandingResponse } from '../models/MyContributorStandingResponse';
import type { PageChangesetResponse } from '../models/PageChangesetResponse';
import type { PageChangesetReviewResponse } from '../models/PageChangesetReviewResponse';
import type { PageContributorResponse } from '../models/PageContributorResponse';
import type { PromotionCandidateResponse } from '../models/PromotionCandidateResponse';
import type { ProposeStopResponse } from '../models/ProposeStopResponse';
import type { RejectChangesetRequest } from '../models/RejectChangesetRequest';
import type { StewardAppointmentRequest } from '../models/StewardAppointmentRequest';
import type { StopProposalRequest } from '../models/StopProposalRequest';
import type { WorkingProposalRequest } from '../models/WorkingProposalRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CommunityContributorsService {
    /**
     * The contributor agreement in force
     * @returns ContributorAgreementResponse OK
     * @throws ApiError
     */
    public static getContributorAgreement(): CancelablePromise<ContributorAgreementResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/community/agreement',
        });
    }
    /**
     * Apply to become a contributor (passengers with a verified email)
     * @param requestBody
     * @returns ContributorResponse OK
     * @throws ApiError
     */
    public static applyToContribute(
        requestBody: ContributorApplicationRequest,
    ): CancelablePromise<ContributorResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/community/applications',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * The review queue: stop and working proposals, oldest first. Staff see all; a steward sees only their corridors, without proposer identity
     * @param entityType
     * @param status
     * @param proposerUserId
     * @param homeDistrict
     * @param page
     * @param size
     * @returns PageChangesetReviewResponse OK
     * @throws ApiError
     */
    public static listChangesetsForReview(
        entityType?: 'STOP' | 'SCHEDULE_WORKING',
        status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN' | 'REVERTED',
        proposerUserId?: string,
        homeDistrict?: string,
        page?: number,
        size: number = 20,
    ): CancelablePromise<PageChangesetReviewResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/community/changesets',
            query: {
                'entityType': entityType,
                'status': status,
                'proposerUserId': proposerUserId,
                'homeDistrict': homeDistrict,
                'page': page,
                'size': size,
            },
        });
    }
    /**
     * The signed-in user's own proposals, newest first
     * @param status
     * @param page
     * @param size
     * @returns PageChangesetResponse OK
     * @throws ApiError
     */
    public static listMyChangesets(
        status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN' | 'REVERTED',
        page?: number,
        size: number = 20,
    ): CancelablePromise<PageChangesetResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/community/changesets/mine',
            query: {
                'status': status,
                'page': page,
                'size': size,
            },
        });
    }
    /**
     * Approve a stop proposal — writes the canonical stop, credited and labelled observed
     * @param changesetId
     * @returns ChangesetResponse OK
     * @throws ApiError
     */
    public static approveChangeset(
        changesetId: string,
    ): CancelablePromise<ChangesetResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/community/changesets/{changesetId}/approve',
            path: {
                'changesetId': changesetId,
            },
        });
    }
    /**
     * Reject a stop proposal with a reason the contributor will see
     * @param changesetId
     * @param requestBody
     * @returns ChangesetResponse OK
     * @throws ApiError
     */
    public static rejectChangeset(
        changesetId: string,
        requestBody: RejectChangesetRequest,
    ): CancelablePromise<ChangesetResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/community/changesets/{changesetId}/reject',
            path: {
                'changesetId': changesetId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Undo an approved stop proposal, restoring the stop's previous values and provenance
     * @param changesetId
     * @returns ChangesetResponse OK
     * @throws ApiError
     */
    public static revertChangeset(
        changesetId: string,
    ): CancelablePromise<ChangesetResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/community/changesets/{changesetId}/revert',
            path: {
                'changesetId': changesetId,
            },
        });
    }
    /**
     * One proposal with the stop it targets, the distance between positions, and the contributor's record
     * @param changesetId
     * @returns ChangesetReviewResponse OK
     * @throws ApiError
     */
    public static getChangesetForReview(
        changesetId: string,
    ): CancelablePromise<ChangesetReviewResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/community/changesets/{changesetId}/review',
            path: {
                'changesetId': changesetId,
            },
        });
    }
    /**
     * Withdraw one of the signed-in user's own pending proposals
     * @param changesetId
     * @returns ChangesetResponse OK
     * @throws ApiError
     */
    public static withdrawChangeset(
        changesetId: string,
    ): CancelablePromise<ChangesetResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/community/changesets/{changesetId}/withdraw',
            path: {
                'changesetId': changesetId,
            },
        });
    }
    /**
     * List contributors and applications, oldest application first
     * @param status
     * @param page
     * @param size
     * @returns PageContributorResponse OK
     * @throws ApiError
     */
    public static listContributors(
        status?: 'APPLIED' | 'ACTIVE' | 'DECLINED' | 'SUSPENDED',
        page?: number,
        size: number = 20,
    ): CancelablePromise<PageContributorResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/community/contributors',
            query: {
                'status': status,
                'page': page,
                'size': size,
            },
        });
    }
    /**
     * How many contributors are in each status
     * @returns ContributorCountsResponse OK
     * @throws ApiError
     */
    public static countContributors(): CancelablePromise<ContributorCountsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/community/contributors/counts',
        });
    }
    /**
     * Active contributors whose record clears the promotion thresholds; advisory, appoints nobody
     * @returns PromotionCandidateResponse OK
     * @throws ApiError
     */
    public static listPromotionCandidates(): CancelablePromise<Array<PromotionCandidateResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/community/contributors/promotion-candidates',
        });
    }
    /**
     * One contributor or application
     * @param userId
     * @returns ContributorResponse OK
     * @throws ApiError
     */
    public static getContributor(
        userId: string,
    ): CancelablePromise<ContributorResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/community/contributors/{userId}',
            path: {
                'userId': userId,
            },
        });
    }
    /**
     * Accept an application
     * @param userId
     * @returns ContributorResponse OK
     * @throws ApiError
     */
    public static acceptContributor(
        userId: string,
    ): CancelablePromise<ContributorResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/community/contributors/{userId}/accept',
            path: {
                'userId': userId,
            },
        });
    }
    /**
     * Decline an application; the reason is shown to the applicant
     * @param userId
     * @param requestBody
     * @returns ContributorResponse OK
     * @throws ApiError
     */
    public static declineContributor(
        userId: string,
        requestBody: ContributorDecisionRequest,
    ): CancelablePromise<ContributorResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/community/contributors/{userId}/decline',
            path: {
                'userId': userId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Reinstate a suspended contributor
     * @param userId
     * @returns ContributorResponse OK
     * @throws ApiError
     */
    public static reinstateContributor(
        userId: string,
    ): CancelablePromise<ContributorResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/community/contributors/{userId}/reinstate',
            path: {
                'userId': userId,
            },
        });
    }
    /**
     * Appoint a contributor steward for the given corridors, or change their corridors
     * @param userId
     * @param requestBody
     * @returns ContributorResponse OK
     * @throws ApiError
     */
    public static appointSteward(
        userId: string,
        requestBody: StewardAppointmentRequest,
    ): CancelablePromise<ContributorResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/community/contributors/{userId}/steward',
            path: {
                'userId': userId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Revoke stewardship; the contributor stays an active contributor
     * @param userId
     * @returns ContributorResponse OK
     * @throws ApiError
     */
    public static revokeSteward(
        userId: string,
    ): CancelablePromise<ContributorResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/community/contributors/{userId}/steward',
            path: {
                'userId': userId,
            },
        });
    }
    /**
     * Suspend an active contributor; takes effect on their next request
     * @param userId
     * @param requestBody
     * @returns ContributorResponse OK
     * @throws ApiError
     */
    public static suspendContributor(
        userId: string,
        requestBody: ContributorDecisionRequest,
    ): CancelablePromise<ContributorResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/community/contributors/{userId}/suspend',
            path: {
                'userId': userId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Where the signed-in user stands in the contributor programme
     * @returns MyContributorStandingResponse OK
     * @throws ApiError
     */
    public static getMyContributorStanding(): CancelablePromise<MyContributorStandingResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/community/me',
        });
    }
    /**
     * Accept the contributor agreement now in force
     * @param requestBody
     * @returns ContributorResponse OK
     * @throws ApiError
     */
    public static acceptContributorAgreement(
        requestBody: AgreementAcceptanceRequest,
    ): CancelablePromise<ContributorResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/community/me/agreement',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Propose a new stop or a correction to one (active contributors only)
     * @param requestBody
     * @returns ProposeStopResponse OK
     * @throws ApiError
     */
    public static proposeStop(
        requestBody: StopProposalRequest,
    ): CancelablePromise<ProposeStopResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/community/stop-proposals',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Propose who usually works a departure (active contributors only)
     * @param requestBody
     * @returns ChangesetResponse Created
     * @throws ApiError
     */
    public static proposeScheduleWorking(
        requestBody: WorkingProposalRequest,
    ): CancelablePromise<ChangesetResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/community/working-proposals',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
