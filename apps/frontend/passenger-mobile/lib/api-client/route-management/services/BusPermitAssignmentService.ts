/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BusPassengerServicePermitAssignmentRequest } from '../models/BusPassengerServicePermitAssignmentRequest';
import type { BusPassengerServicePermitAssignmentResponse } from '../models/BusPassengerServicePermitAssignmentResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BusPermitAssignmentService {
    /**
     * @returns BusPassengerServicePermitAssignmentResponse OK
     * @throws ApiError
     */
    public static getAllAssignments(): CancelablePromise<Array<BusPassengerServicePermitAssignmentResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/bus-permit-assignments',
        });
    }
    /**
     * @param requestBody
     * @returns BusPassengerServicePermitAssignmentResponse OK
     * @throws ApiError
     */
    public static createAssignment(
        requestBody: BusPassengerServicePermitAssignmentRequest,
    ): CancelablePromise<BusPassengerServicePermitAssignmentResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/bus-permit-assignments',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns BusPassengerServicePermitAssignmentResponse OK
     * @throws ApiError
     */
    public static getAssignmentById(
        id: string,
    ): CancelablePromise<BusPassengerServicePermitAssignmentResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/bus-permit-assignments/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns BusPassengerServicePermitAssignmentResponse OK
     * @throws ApiError
     */
    public static updateAssignment(
        id: string,
        requestBody: BusPassengerServicePermitAssignmentRequest,
    ): CancelablePromise<BusPassengerServicePermitAssignmentResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/bus-permit-assignments/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static deleteAssignment(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/bus-permit-assignments/{id}',
            path: {
                'id': id,
            },
        });
    }
}
