/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateUserRequest } from '../models/CreateUserRequest';
import type { Pageable } from '../models/Pageable';
import type { PageUserResponse } from '../models/PageUserResponse';
import type { RegisterResponse } from '../models/RegisterResponse';
import type { UpdateUserRequest } from '../models/UpdateUserRequest';
import type { UserPermissionsResponse } from '../models/UserPermissionsResponse';
import type { UserResponse } from '../models/UserResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UsersControllerService {
    /**
     * @param userType
     * @param pageable
     * @param status
     * @param search
     * @returns PageUserResponse OK
     * @throws ApiError
     */
    public static listUsers(
        userType: string,
        pageable: Pageable,
        status?: string,
        search?: string,
    ): CancelablePromise<PageUserResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users',
            query: {
                'user_type': userType,
                'status': status,
                'search': search,
                'pageable': pageable,
            },
        });
    }
    /**
     * @param requestBody
     * @returns RegisterResponse OK
     * @throws ApiError
     */
    public static createUser(
        requestBody: CreateUserRequest,
    ): CancelablePromise<RegisterResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param userId
     * @returns UserResponse OK
     * @throws ApiError
     */
    public static getUser(
        userId: string,
    ): CancelablePromise<UserResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/{userId}',
            path: {
                'userId': userId,
            },
        });
    }
    /**
     * @param userId
     * @returns any OK
     * @throws ApiError
     */
    public static deleteUser(
        userId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/users/{userId}',
            path: {
                'userId': userId,
            },
        });
    }
    /**
     * @param userId
     * @param requestBody
     * @returns UserResponse OK
     * @throws ApiError
     */
    public static updateUser(
        userId: string,
        requestBody: UpdateUserRequest,
    ): CancelablePromise<UserResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/users/{userId}',
            path: {
                'userId': userId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param userId
     * @returns any OK
     * @throws ApiError
     */
    public static getProfile(
        userId: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/{userId}/profile',
            path: {
                'userId': userId,
            },
        });
    }
    /**
     * @param userId
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static updateProfile(
        userId: string,
        requestBody: Record<string, any>,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/users/{userId}/profile',
            path: {
                'userId': userId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param userId
     * @returns UserPermissionsResponse OK
     * @throws ApiError
     */
    public static getPermissions(
        userId: string,
    ): CancelablePromise<UserPermissionsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/{userId}/permissions',
            path: {
                'userId': userId,
            },
        });
    }
}
