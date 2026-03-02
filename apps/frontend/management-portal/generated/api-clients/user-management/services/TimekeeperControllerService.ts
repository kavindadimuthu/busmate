/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TimekeeperDTO } from '../models/TimekeeperDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TimekeeperControllerService {
    /**
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static signup(
        requestBody: TimekeeperDTO,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/timekeeper/register',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param userId
     * @returns any OK
     * @throws ApiError
     */
    public static getTimekeeperById(
        userId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/timekeeper/profile/{userId}',
            path: {
                'userId': userId,
            },
        });
    }
    /**
     * @returns Array<TimekeeperDTO> OK
     * @throws ApiError
     */
    public static getAllTimekeepers(): CancelablePromise<Array<TimekeeperDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/timekeeper/all',
        });
    }



}
