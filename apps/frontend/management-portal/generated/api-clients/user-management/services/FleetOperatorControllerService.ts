/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { fleetOperatorDTO } from '../models/fleetOperatorDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FleetOperatorControllerService {
    /**
     * @param userId
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static updateFleetOperatorProfile(
        userId: string,
        requestBody: fleetOperatorDTO,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/fleetoperator/update',
            query: {
                'userId': userId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static registerFleetOperator(
        requestBody: fleetOperatorDTO,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/fleetoperator/register',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param userId
     * @returns fleetOperatorDTO OK
     * @throws ApiError
     */
    public static getFleetOperatorProfile(
        userId: string,
    ): CancelablePromise<fleetOperatorDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/fleetoperator/profile',
            query: {
                'userId': userId,
            },
        });
    }
    /**
     * @param userId
     * @returns any OK
     * @throws ApiError
     */
    public static deleteFleetOperator(
        userId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/fleetoperator/delete/{userId}',
            path: {
                'userId': userId,
            },
        });
    }
}
