/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthMeResponse } from '../models/AuthMeResponse';
import type { ChangePasswordRequest } from '../models/ChangePasswordRequest';
import type { ForgotPasswordRequest } from '../models/ForgotPasswordRequest';
import type { LoginRequestDTO } from '../models/LoginRequestDTO';
import type { LoginResponse } from '../models/LoginResponse';
import type { RefreshTokenRequest } from '../models/RefreshTokenRequest';
import type { RegisterRequest } from '../models/RegisterRequest';
import type { RegisterResponse } from '../models/RegisterResponse';
import type { ResetPasswordRequest } from '../models/ResetPasswordRequest';
import type { VerifyEmailRequest } from '../models/VerifyEmailRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthControllerService {
    /**
     * @param requestBody
     * @returns string OK
     * @throws ApiError
     */
    public static verifyEmail(
        requestBody: VerifyEmailRequest,
    ): CancelablePromise<Record<string, string>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/verify-email',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns string OK
     * @throws ApiError
     */
    public static resetPassword(
        requestBody: ResetPasswordRequest,
    ): CancelablePromise<Record<string, string>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/reset-password',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns RegisterResponse OK
     * @throws ApiError
     */
    public static register(
        requestBody: RegisterRequest,
    ): CancelablePromise<RegisterResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/register',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns LoginResponse OK
     * @throws ApiError
     */
    public static refresh(
        requestBody: RefreshTokenRequest,
    ): CancelablePromise<LoginResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/refresh',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param authorization
     * @returns any OK
     * @throws ApiError
     */
    public static logout(
        authorization: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/logout',
            headers: {
                'Authorization': authorization,
            },
        });
    }
    /**
     * @param requestBody
     * @returns LoginResponse OK
     * @throws ApiError
     */
    public static login(
        requestBody: LoginRequestDTO,
    ): CancelablePromise<LoginResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/login',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns string OK
     * @throws ApiError
     */
    public static forgotPassword(
        requestBody: ForgotPasswordRequest,
    ): CancelablePromise<Record<string, string>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/forgot-password',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns string OK
     * @throws ApiError
     */
    public static changePassword(
        requestBody: ChangePasswordRequest,
    ): CancelablePromise<Record<string, string>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/change-password',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns AuthMeResponse OK
     * @throws ApiError
     */
    public static me(): CancelablePromise<AuthMeResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/me',
        });
    }
}
