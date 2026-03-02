/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FareCalculationRequestDTO } from '../models/FareCalculationRequestDTO';
import type { RouteFareDTO } from '../models/RouteFareDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class RouteFareControllerService {
    /**
     * @param requestBody
     * @returns string OK
     * @throws ApiError
     */
    public static saveRouteFare(
        requestBody: RouteFareDTO,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/routeFare/save-route-fare-section',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns string OK
     * @throws ApiError
     */
    public static calculateFare(
        requestBody: FareCalculationRequestDTO,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/routeFare/calculate-fare',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
