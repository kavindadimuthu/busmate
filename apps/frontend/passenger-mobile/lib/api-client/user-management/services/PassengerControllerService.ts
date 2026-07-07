/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PassengerDTO } from '../models/PassengerDTO';
import type { PassengerUpdateDTO } from '../models/PassengerUpdateDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PassengerControllerService {
    /**
     * @param userId
     * @param requestBody
     * @returns PassengerDTO OK
     * @throws ApiError
     */
    public static updatePassenger(
        userId: string,
        requestBody: PassengerUpdateDTO,
    ): CancelablePromise<PassengerDTO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/passenger/update/{userId}',
            path: {
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
    public static addPassenger(
        requestBody: PassengerDTO,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/passenger/register',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param userId
     * @returns PassengerDTO OK
     * @throws ApiError
     */
    public static getPassengerById(
        userId: string,
    ): CancelablePromise<PassengerDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/passenger/profile',
            query: {
                'userId': userId,
            },
        });
    }
    /**
     * @returns PassengerDTO OK
     * @throws ApiError
     */
    public static getAllPassengers(): CancelablePromise<Array<PassengerDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/passenger/all',
        });
    }
}
