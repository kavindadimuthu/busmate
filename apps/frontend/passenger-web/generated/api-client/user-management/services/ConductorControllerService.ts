/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConductorDTO } from '../models/ConductorDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ConductorControllerService {
    /**
     * @param userId
     * @param requestBody
     * @returns ConductorDTO OK
     * @throws ApiError
     */
    public static updateConductor(
        userId: string,
        requestBody: ConductorDTO,
    ): CancelablePromise<ConductorDTO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/conductor/update',
            query: {
                'userId': userId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns string OK
     * @throws ApiError
     */
    public static createConductor(
        requestBody: ConductorDTO,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/conductor/register',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param userId
     * @returns ConductorDTO OK
     * @throws ApiError
     */
    public static getConductorsById(
        userId: string,
    ): CancelablePromise<ConductorDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/conductor/profile',
            query: {
                'userId': userId,
            },
        });
    }
    /**
     * @returns ConductorDTO OK
     * @throws ApiError
     */
    public static getAllConductors(): CancelablePromise<Array<ConductorDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/conductor/all',
        });
    }
    /**
     * @param userId
     * @returns string OK
     * @throws ApiError
     */
    public static deleteConductor(
        userId: string,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/conductor/delete/{userId}',
            path: {
                'userId': userId,
            },
        });
    }
}
