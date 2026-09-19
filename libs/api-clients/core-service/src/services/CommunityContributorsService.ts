/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgreementAcceptanceRequest } from '../models/AgreementAcceptanceRequest';
import type { ContributorAgreementResponse } from '../models/ContributorAgreementResponse';
import type { ContributorApplicationRequest } from '../models/ContributorApplicationRequest';
import type { ContributorCountsResponse } from '../models/ContributorCountsResponse';
import type { ContributorDecisionRequest } from '../models/ContributorDecisionRequest';
import type { ContributorResponse } from '../models/ContributorResponse';
import type { MyContributorStandingResponse } from '../models/MyContributorStandingResponse';
import type { PageContributorResponse } from '../models/PageContributorResponse';
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
}
