/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConductorLogTicketDTO } from '../models/ConductorLogTicketDTO';
import type { PaymentRequestDTO } from '../models/PaymentRequestDTO';
import type { TripSummaryDTO } from '../models/TripSummaryDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TicketControllerService {
    /**
     * @param requestBody
     * @returns string OK
     * @throws ApiError
     */
    public static createTicket(
        requestBody: PaymentRequestDTO,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/tickets/conductor/issue',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param tripId
     * @returns ConductorLogTicketDTO OK
     * @throws ApiError
     */
    public static getTicketsByTripId(
        tripId: string,
    ): CancelablePromise<Array<ConductorLogTicketDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/tickets/trip/{tripId}',
            path: {
                'tripId': tripId,
            },
        });
    }
    /**
     * @param tripId
     * @returns TripSummaryDTO OK
     * @throws ApiError
     */
    public static getTripSummary(
        tripId: string,
    ): CancelablePromise<TripSummaryDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/tickets/trip/{tripId}/summary',
            path: {
                'tripId': tripId,
            },
        });
    }
    /**
     * @param conductorId
     * @returns ConductorLogTicketDTO OK
     * @throws ApiError
     */
    public static getConductorLogs(
        conductorId: string,
    ): CancelablePromise<Array<ConductorLogTicketDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/tickets/conductor/{conductorId}/logs',
            path: {
                'conductorId': conductorId,
            },
        });
    }
    /**
     * @param busId
     * @returns ConductorLogTicketDTO OK
     * @throws ApiError
     */
    public static getTicketsByBusId(
        busId: string,
    ): CancelablePromise<Array<ConductorLogTicketDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/tickets/bus/{busId}',
            path: {
                'busId': busId,
            },
        });
    }
}
