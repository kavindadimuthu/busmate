/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CheckPermissionRequest } from '../models/CheckPermissionRequest';
import type { InternalUserResponse } from '../models/InternalUserResponse';
import type { ValidateTokenRequest } from '../models/ValidateTokenRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class InternalControllerService {
    /**
     * @param requestBody
     * @returns InternalUserResponse OK
     * @throws ApiError
     */
    public static validate(
        requestBody: ValidateTokenRequest,
    ): CancelablePromise<InternalUserResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/internal/auth/validate',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static checkPermission(
        requestBody: CheckPermissionRequest,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/internal/auth/check-permission',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param userId
     * @returns InternalUserResponse OK
     * @throws ApiError
     */
    public static getUser1(
        userId: string,
    ): CancelablePromise<InternalUserResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/internal/users/{userId}',
            path: {
                'userId': userId,
            },
        });
    }
}
