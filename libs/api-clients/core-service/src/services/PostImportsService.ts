/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreatePostImportRequest } from '../models/CreatePostImportRequest';
import type { PagePostImportDraftSummary } from '../models/PagePostImportDraftSummary';
import type { PostImportDraftResponse } from '../models/PostImportDraftResponse';
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
}
