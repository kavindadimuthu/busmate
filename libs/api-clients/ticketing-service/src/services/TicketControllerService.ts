/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BookingRequestDTO } from '../models/BookingRequestDTO';
import type { BookingResponseDTO } from '../models/BookingResponseDTO';
import type { ConductorLogTicketDTO } from '../models/ConductorLogTicketDTO';
import type { PageConductorLogTicketDTO } from '../models/PageConductorLogTicketDTO';
import type { PaymentConfirmResponseDTO } from '../models/PaymentConfirmResponseDTO';
import type { PaymentRequestDTO } from '../models/PaymentRequestDTO';
import type { TicketCancelRequestDTO } from '../models/TicketCancelRequestDTO';
import type { TicketValidationRequestDTO } from '../models/TicketValidationRequestDTO';
import type { TripSummaryDTO } from '../models/TripSummaryDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TicketControllerService {
    /**
     * @param ticketId
     * @param requestBody
     * @param xUserId
     * @param xUserType
     * @returns ConductorLogTicketDTO OK
     * @throws ApiError
     */
    public static cancelTicket(
        ticketId: number,
        requestBody: TicketCancelRequestDTO,
        xUserId?: string,
        xUserType?: string,
    ): CancelablePromise<ConductorLogTicketDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/tickets/{ticketId}/cancel',
            path: {
                'ticketId': ticketId,
            },
            headers: {
                'x-user-id': xUserId,
                'x-user-type': xUserType,
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
    public static validateTicket(
        requestBody: TicketValidationRequestDTO,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/tickets/validate',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param ticketId
     * @param xUserId
     * @param xUserType
     * @returns PaymentConfirmResponseDTO OK
     * @throws ApiError
     */
    public static confirmPayment(
        ticketId: number,
        xUserId?: string,
        xUserType?: string,
    ): CancelablePromise<PaymentConfirmResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/tickets/payment/{ticketId}/confirm',
            path: {
                'ticketId': ticketId,
            },
            headers: {
                'x-user-id': xUserId,
                'x-user-type': xUserType,
            },
        });
    }
    /**
     * @param requestBody
     * @returns ConductorLogTicketDTO OK
     * @throws ApiError
     */
    public static createTicket(
        requestBody: PaymentRequestDTO,
    ): CancelablePromise<ConductorLogTicketDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/tickets/conductor/issue',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @param xUserId
     * @param xUserType
     * @returns BookingResponseDTO OK
     * @throws ApiError
     */
    public static bookTicket(
        requestBody: BookingRequestDTO,
        xUserId?: string,
        xUserType?: string,
    ): CancelablePromise<BookingResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/tickets/book',
            headers: {
                'x-user-id': xUserId,
                'x-user-type': xUserType,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param page
     * @param size
     * @param sortBy
     * @param sortDir
     * @param busIds
     * @param tripId
     * @param conductorId
     * @param passengerId
     * @param issueMethod
     * @param validationStatus
     * @param dateFrom
     * @param dateTo
     * @param search
     * @returns PageConductorLogTicketDTO OK
     * @throws ApiError
     */
    public static getAllTickets(
        page?: number,
        size: number = 10,
        sortBy: string = 'issuedAt',
        sortDir: string = 'desc',
        busIds?: Array<string>,
        tripId?: string,
        conductorId?: string,
        passengerId?: string,
        issueMethod?: string,
        validationStatus?: string,
        dateFrom?: string,
        dateTo?: string,
        search?: string,
    ): CancelablePromise<PageConductorLogTicketDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/tickets',
            query: {
                'page': page,
                'size': size,
                'sortBy': sortBy,
                'sortDir': sortDir,
                'busIds': busIds,
                'tripId': tripId,
                'conductorId': conductorId,
                'passengerId': passengerId,
                'issueMethod': issueMethod,
                'validationStatus': validationStatus,
                'dateFrom': dateFrom,
                'dateTo': dateTo,
                'search': search,
            },
        });
    }
    /**
     * @param ticketId
     * @param xUserId
     * @param xUserType
     * @returns ConductorLogTicketDTO OK
     * @throws ApiError
     */
    public static getTicketById(
        ticketId: number,
        xUserId?: string,
        xUserType?: string,
    ): CancelablePromise<ConductorLogTicketDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/tickets/{ticketId}',
            path: {
                'ticketId': ticketId,
            },
            headers: {
                'x-user-id': xUserId,
                'x-user-type': xUserType,
            },
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
     * @param passengerId
     * @param xUserId
     * @param xUserType
     * @returns ConductorLogTicketDTO OK
     * @throws ApiError
     */
    public static getTicketsByPassengerId(
        passengerId: string,
        xUserId?: string,
        xUserType?: string,
    ): CancelablePromise<Array<ConductorLogTicketDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/tickets/passenger/{passengerId}',
            path: {
                'passengerId': passengerId,
            },
            headers: {
                'x-user-id': xUserId,
                'x-user-type': xUserType,
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
