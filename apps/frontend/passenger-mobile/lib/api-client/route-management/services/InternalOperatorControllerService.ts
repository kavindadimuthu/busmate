/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { InternalOperatorRequest } from '../models/InternalOperatorRequest';
import type { InternalOperatorStatusRequest } from '../models/InternalOperatorStatusRequest';
import type { OperatorResponse } from '../models/OperatorResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class InternalOperatorControllerService {
    /**
     * @param requestBody
     * @returns OperatorResponse OK
     * @throws ApiError
     */
    public static createOrGetOperator(
        requestBody: InternalOperatorRequest,
    ): CancelablePromise<OperatorResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/internal/operators',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param userId
     * @param requestBody
     * @returns OperatorResponse OK
     * @throws ApiError
     */
    public static updateOperator1(
        userId: string,
        requestBody: InternalOperatorRequest,
    ): CancelablePromise<OperatorResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/internal/operators/by-user/{userId}',
            path: {
                'userId': userId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param userId
     * @param requestBody
     * @returns OperatorResponse OK
     * @throws ApiError
     */
    public static updateOperatorStatus(
        userId: string,
        requestBody: InternalOperatorStatusRequest,
    ): CancelablePromise<OperatorResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/internal/operators/by-user/{userId}/status',
            path: {
                'userId': userId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
