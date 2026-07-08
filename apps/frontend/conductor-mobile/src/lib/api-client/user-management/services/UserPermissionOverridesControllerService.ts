/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OverrideResponse } from '../models/OverrideResponse';
import type { UpsertOverrideRequest } from '../models/UpsertOverrideRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UserPermissionOverridesControllerService {
    /**
     * @param userId
     * @param permissionId
     * @param requestBody
     * @returns OverrideResponse OK
     * @throws ApiError
     */
    public static upsert(
        userId: string,
        permissionId: string,
        requestBody: UpsertOverrideRequest,
    ): CancelablePromise<OverrideResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/users/{userId}/permission-overrides/{permissionId}',
            path: {
                'userId': userId,
                'permissionId': permissionId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param userId
     * @param permissionId
     * @returns any OK
     * @throws ApiError
     */
    public static remove(
        userId: string,
        permissionId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/users/{userId}/permission-overrides/{permissionId}',
            path: {
                'userId': userId,
                'permissionId': permissionId,
            },
        });
    }
    /**
     * @param userId
     * @returns OverrideResponse OK
     * @throws ApiError
     */
    public static list2(
        userId: string,
    ): CancelablePromise<Array<OverrideResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/{userId}/permission-overrides',
            path: {
                'userId': userId,
            },
        });
    }
}
