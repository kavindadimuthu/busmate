/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateUserTypeRequest } from '../models/CreateUserTypeRequest';
import type { GrantPermissionRequest } from '../models/GrantPermissionRequest';
import type { ReplacePermissionsRequest } from '../models/ReplacePermissionsRequest';
import type { TypePermissionResponse } from '../models/TypePermissionResponse';
import type { UpdateUserTypeRequest } from '../models/UpdateUserTypeRequest';
import type { UserTypeDetailResponse } from '../models/UserTypeDetailResponse';
import type { UserTypeResponse } from '../models/UserTypeResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UserTypesControllerService {
    /**
     * @param typeId
     * @returns TypePermissionResponse OK
     * @throws ApiError
     */
    public static listPermissions(
        typeId: string,
    ): CancelablePromise<Array<TypePermissionResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/user-types/{typeId}/permissions',
            path: {
                'typeId': typeId,
            },
        });
    }
    /**
     * @param typeId
     * @param requestBody
     * @returns TypePermissionResponse OK
     * @throws ApiError
     */
    public static replacePermissions(
        typeId: string,
        requestBody: ReplacePermissionsRequest,
    ): CancelablePromise<Array<TypePermissionResponse>> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/user-types/{typeId}/permissions',
            path: {
                'typeId': typeId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param typeId
     * @param permissionId
     * @param requestBody
     * @returns TypePermissionResponse OK
     * @throws ApiError
     */
    public static setPermission(
        typeId: string,
        permissionId: string,
        requestBody: GrantPermissionRequest,
    ): CancelablePromise<TypePermissionResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/user-types/{typeId}/permissions/{permissionId}',
            path: {
                'typeId': typeId,
                'permissionId': permissionId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param typeId
     * @param permissionId
     * @returns any OK
     * @throws ApiError
     */
    public static removePermission(
        typeId: string,
        permissionId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/user-types/{typeId}/permissions/{permissionId}',
            path: {
                'typeId': typeId,
                'permissionId': permissionId,
            },
        });
    }
    /**
     * @returns UserTypeResponse OK
     * @throws ApiError
     */
    public static list(): CancelablePromise<Array<UserTypeResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/user-types',
        });
    }
    /**
     * @param requestBody
     * @returns UserTypeResponse OK
     * @throws ApiError
     */
    public static create(
        requestBody: CreateUserTypeRequest,
    ): CancelablePromise<UserTypeResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/user-types',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param typeId
     * @returns UserTypeDetailResponse OK
     * @throws ApiError
     */
    public static get(
        typeId: string,
    ): CancelablePromise<UserTypeDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/user-types/{typeId}',
            path: {
                'typeId': typeId,
            },
        });
    }
    /**
     * @param typeId
     * @returns any OK
     * @throws ApiError
     */
    public static delete(
        typeId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/user-types/{typeId}',
            path: {
                'typeId': typeId,
            },
        });
    }
    /**
     * @param typeId
     * @param requestBody
     * @returns UserTypeResponse OK
     * @throws ApiError
     */
    public static update(
        typeId: string,
        requestBody: UpdateUserTypeRequest,
    ): CancelablePromise<UserTypeResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/user-types/{typeId}',
            path: {
                'typeId': typeId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
