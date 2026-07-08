/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreatePermissionRequest } from '../models/CreatePermissionRequest';
import type { PermissionResponse } from '../models/PermissionResponse';
import type { UpdatePermissionRequest } from '../models/UpdatePermissionRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PermissionsControllerService {
    /**
     * @param resource
     * @param action
     * @returns PermissionResponse OK
     * @throws ApiError
     */
    public static list1(
        resource?: string,
        action?: string,
    ): CancelablePromise<Array<PermissionResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/permissions',
            query: {
                'resource': resource,
                'action': action,
            },
        });
    }
    /**
     * @param requestBody
     * @returns PermissionResponse OK
     * @throws ApiError
     */
    public static create1(
        requestBody: CreatePermissionRequest,
    ): CancelablePromise<PermissionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/permissions',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param permissionId
     * @returns PermissionResponse OK
     * @throws ApiError
     */
    public static get1(
        permissionId: string,
    ): CancelablePromise<PermissionResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/permissions/{permissionId}',
            path: {
                'permissionId': permissionId,
            },
        });
    }
    /**
     * @param permissionId
     * @returns any OK
     * @throws ApiError
     */
    public static delete1(
        permissionId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/permissions/{permissionId}',
            path: {
                'permissionId': permissionId,
            },
        });
    }
    /**
     * @param permissionId
     * @param requestBody
     * @returns PermissionResponse OK
     * @throws ApiError
     */
    public static update1(
        permissionId: string,
        requestBody: UpdatePermissionRequest,
    ): CancelablePromise<PermissionResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/permissions/{permissionId}',
            path: {
                'permissionId': permissionId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
