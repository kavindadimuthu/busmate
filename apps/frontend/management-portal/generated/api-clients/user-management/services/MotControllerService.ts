/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MotDTO } from '../models/MotDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MotControllerService {
    /**
     * @param userId
     * @param fullName
     * @param phoneNumber
     * @returns MotDTO OK
     * @throws ApiError
     */
    public static updateMotUser(
        userId: string,
        fullName: string,
        phoneNumber: string,
    ): CancelablePromise<MotDTO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/mot/update',
            query: {
                'userId': userId,
                'fullName': fullName,
                'phoneNumber': phoneNumber,
            },
        });
    }
    /**
     * @param requestBody
     * @returns string OK
     * @throws ApiError
     */
    public static addMotUser(
        requestBody: MotDTO,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/mot/register',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param userId
     * @returns MotDTO OK
     * @throws ApiError
     */
    public static getMotById(
        userId: string,
    ): CancelablePromise<MotDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/mot/profile',
            query: {
                'userId': userId,
            },
        });
    }
}
