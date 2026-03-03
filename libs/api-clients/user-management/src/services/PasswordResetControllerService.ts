/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ResetPasswdDTO } from '../models/ResetPasswdDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PasswordResetControllerService {
    /**
     * @param requestBody
     * @returns string OK
     * @throws ApiError
     */
    public static sendResetEmail(
        requestBody: ResetPasswdDTO,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/reset-password',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
