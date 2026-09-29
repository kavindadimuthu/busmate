/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreatePostImportRequest } from '../models/CreatePostImportRequest';
import type { DraftResolutionRequest } from '../models/DraftResolutionRequest';
import type { PagePostImportDraftSummary } from '../models/PagePostImportDraftSummary';
import type { PostImportDraftResponse } from '../models/PostImportDraftResponse';
import type { StopMatchCandidate } from '../models/StopMatchCandidate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PostImportsService {
    /**
     * Read a pasted post and check the reading
     * @param requestBody
     * @returns PostImportDraftResponse OK
     * @throws ApiError
     */
    public static createPostImport(
        requestBody: CreatePostImportRequest,
    ): CancelablePromise<PostImportDraftResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/community/post-imports',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * One post import, with its reading and check results
     * @param id
     * @returns PostImportDraftResponse OK
     * @throws ApiError
     */
    public static getPostImport(
        id: string,
    ): CancelablePromise<PostImportDraftResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/community/post-imports/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Past post imports, newest first
     * @param page
     * @param size
     * @returns PagePostImportDraftSummary OK
     * @throws ApiError
     */
    public static listPostImports(
        page?: number,
        size: number = 20,
    ): CancelablePromise<PagePostImportDraftSummary> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/community/post-imports',
            query: {
                'page': page,
                'size': size,
            },
        });
    }
    /**
     * Existing stops that might be this place name; staff confirm, code never decides alone
     * @param name
     * @returns StopMatchCandidate OK
     * @throws ApiError
     */
    public static getPostImportStopCandidates(
        name: string,
    ): CancelablePromise<Array<StopMatchCandidate>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/community/post-imports/stop-candidates',
            query: {
                'name': name,
            },
        });
    }
    /**
     * Save staff's edits, stop matches and decisions for a draft — loads nothing yet
     * @param id
     * @param requestBody
     * @returns PostImportDraftResponse OK
     * @throws ApiError
     */
    public static savePostImportResolution(
        id: string,
        requestBody: DraftResolutionRequest,
    ): CancelablePromise<PostImportDraftResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/community/post-imports/{id}/resolution',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Load the resolved draft's rows as reports, the same rules staff already load by hand under
     * @param id
     * @returns PostImportDraftResponse OK
     * @throws ApiError
     */
    public static approvePostImport(
        id: string,
    ): CancelablePromise<PostImportDraftResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/community/post-imports/{id}/approve',
            path: {
                'id': id,
            },
        });
    }
}
