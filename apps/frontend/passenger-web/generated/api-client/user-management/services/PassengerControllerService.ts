/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PassengerDTO } from '../models/PassengerDTO';
import type { PassengerRegisterRequestDTO } from '../models/PassengerRegisterRequestDTO';
import type { PassengerResponseDTO } from '../models/PassengerResponseDTO';
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
     * @returns PassengerResponseDTO OK
     * @throws ApiError
     */
    public static registerPassenger(
        requestBody: PassengerRegisterRequestDTO,
    ): CancelablePromise<PassengerResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/passenger/register',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param passengerId
     * @returns PassengerResponseDTO OK
     * @throws ApiError
     */
    public static getPassengerById(
        passengerId: string,
    ): CancelablePromise<PassengerResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/passenger/{passengerId}',
            path: {
                'passengerId': passengerId,
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
