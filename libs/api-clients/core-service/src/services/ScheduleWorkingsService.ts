/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ResolveBusRequest } from '../models/ResolveBusRequest';
import type { ResolveOperatorRequest } from '../models/ResolveOperatorRequest';
import type { ScheduleWorkingEndRequest } from '../models/ScheduleWorkingEndRequest';
import type { ScheduleWorkingRequest } from '../models/ScheduleWorkingRequest';
import type { ScheduleWorkingResponse } from '../models/ScheduleWorkingResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { CorrectWorkingRequest } from '../models/CorrectWorkingRequest';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ScheduleWorkingsService {
    /**
     * Correct what was observed about a working; anything left out stays as it is
     * @param workingId
     * @param requestBody
     * @returns ScheduleWorkingResponse OK
     * @throws ApiError
     */
    public static correctScheduleWorking(
        workingId: string,
        requestBody: CorrectWorkingRequest,
    ): CancelablePromise<ScheduleWorkingResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/schedule-workings/{workingId}',
            path: {
                'workingId': workingId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Link a plate seen on a working to a registered bus
     * @param vehicleId
     * @param requestBody
     * @returns ScheduleWorkingResponse OK
     * @throws ApiError
     */
    public static resolveScheduleWorkingBus(
        vehicleId: string,
        requestBody: ResolveBusRequest,
    ): CancelablePromise<ScheduleWorkingResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/schedule-working-vehicles/{vehicleId}/bus',
            path: {
                'vehicleId': vehicleId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Remove a working recorded by mistake
     * @param workingId
     * @returns any OK
     * @throws ApiError
     */
    public static deleteScheduleWorking(
        workingId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/schedule-workings/{workingId}',
            path: {
                'workingId': workingId,
            },
        });
    }
    /**
     * Set the last day a working applied
     * @param workingId
     * @param requestBody
     * @returns ScheduleWorkingResponse OK
     * @throws ApiError
     */
    public static endScheduleWorking(
        workingId: string,
        requestBody: ScheduleWorkingEndRequest,
    ): CancelablePromise<ScheduleWorkingResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/schedule-workings/{workingId}/end',
            path: {
                'workingId': workingId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Link a working's operator, seen only as a name, to a registered operator
     * @param workingId
     * @param requestBody
     * @returns ScheduleWorkingResponse OK
     * @throws ApiError
     */
    public static resolveScheduleWorkingOperator(
        workingId: string,
        requestBody: ResolveOperatorRequest,
    ): CancelablePromise<ScheduleWorkingResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/schedule-workings/{workingId}/operator',
            path: {
                'workingId': workingId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * A schedule's workings, oldest first
     * @param scheduleId
     * @returns ScheduleWorkingResponse OK
     * @throws ApiError
     */
    public static listScheduleWorkings(
        scheduleId: string,
    ): CancelablePromise<Array<ScheduleWorkingResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/schedules/{scheduleId}/workings',
            path: {
                'scheduleId': scheduleId,
            },
        });
    }
    /**
     * Record who normally works a departure; a plate or operator name as seen is enough
     * @param scheduleId
     * @param requestBody
     * @returns ScheduleWorkingResponse OK
     * @throws ApiError
     */
    public static createScheduleWorking(
        scheduleId: string,
        requestBody: ScheduleWorkingRequest,
    ): CancelablePromise<ScheduleWorkingResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/schedules/{scheduleId}/workings',
            path: {
                'scheduleId': scheduleId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
