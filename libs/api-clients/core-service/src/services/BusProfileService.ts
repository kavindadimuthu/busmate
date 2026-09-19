/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BusAvailabilityRequest } from '../models/BusAvailabilityRequest';
import type { BusMediaResponse } from '../models/BusMediaResponse';
import type { BusMediaUpdateRequest } from '../models/BusMediaUpdateRequest';
import type { BusPassengerServicePermitAssignmentResponse } from '../models/BusPassengerServicePermitAssignmentResponse';
import type { BusResponse } from '../models/BusResponse';
import type { StatusReasonRequest } from '../models/StatusReasonRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BusProfileService {
    /**
     * Mark a bus available, or out of use for a period
     * @param busId
     * @param requestBody
     * @returns BusResponse OK
     * @throws ApiError
     */
    public static setBusAvailability(
        busId: string,
        requestBody: BusAvailabilityRequest,
    ): CancelablePromise<BusResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/buses/{busId}/availability',
            path: {
                'busId': busId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * How many pending trips a bus is assigned to within a date window
     * Shown before marking a bus unavailable so the operator knows which trips need another bus.
     * @param busId
     * @param from
     * @param until
     * @returns number OK
     * @throws ApiError
     */
    public static getBusAvailabilityImpact(
        busId: string,
        from?: string,
        until?: string,
    ): CancelablePromise<Record<string, number>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/buses/{busId}/availability/impact',
            path: {
                'busId': busId,
            },
            query: {
                'from': from,
                'until': until,
            },
        });
    }
    /**
     * Set or clear the conductor who usually works this bus
     * Pre-fills trip assignments only; the trip's own conductor is the record. Body: {"conductorId": uuid|null}.
     * @param busId
     * @param requestBody
     * @returns BusResponse OK
     * @throws ApiError
     */
    public static setBusDefaultConductor(
        busId: string,
        requestBody: Record<string, string>,
    ): CancelablePromise<BusResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/buses/{busId}/default-conductor',
            path: {
                'busId': busId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * A bus's photos and documents (metadata)
     * @param busId
     * @returns BusMediaResponse OK
     * @throws ApiError
     */
    public static listBusMedia(
        busId: string,
    ): CancelablePromise<Array<BusMediaResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/buses/{busId}/media',
            path: {
                'busId': busId,
            },
        });
    }
    /**
     * Add a photo or document to a bus
     * kind = PHOTO (JPEG/PNG; re-encoded, metadata stripped) or DOCUMENT (PDF or image). Documents need a documentType and may carry an expiry date.
     * @param busId
     * @param kind
     * @param documentType
     * @param title
     * @param expiryDate
     * @param formData
     * @returns BusMediaResponse OK
     * @throws ApiError
     */
    public static uploadBusMedia(
        busId: string,
        kind: string,
        documentType?: string,
        title?: string,
        expiryDate?: string,
        formData?: {
            file: Blob;
        },
    ): CancelablePromise<BusMediaResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/buses/{busId}/media',
            path: {
                'busId': busId,
            },
            query: {
                'kind': kind,
                'documentType': documentType,
                'title': title,
                'expiryDate': expiryDate,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * Delete a photo or document
     * @param busId
     * @param mediaId
     * @returns any OK
     * @throws ApiError
     */
    public static deleteBusMedia(
        busId: string,
        mediaId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/buses/{busId}/media/{mediaId}',
            path: {
                'busId': busId,
                'mediaId': mediaId,
            },
        });
    }
    /**
     * Edit a photo's or document's details, or make a photo the cover
     * @param busId
     * @param mediaId
     * @param requestBody
     * @returns BusMediaResponse OK
     * @throws ApiError
     */
    public static updateBusMedia(
        busId: string,
        mediaId: string,
        requestBody: BusMediaUpdateRequest,
    ): CancelablePromise<BusMediaResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/buses/{busId}/media/{mediaId}',
            path: {
                'busId': busId,
                'mediaId': mediaId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Download a photo or document
     * @param busId
     * @param mediaId
     * @returns string OK
     * @throws ApiError
     */
    public static getBusMediaContent(
        busId: string,
        mediaId: string,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/buses/{busId}/media/{mediaId}/content',
            path: {
                'busId': busId,
                'mediaId': mediaId,
            },
        });
    }
    /**
     * The permits this bus is (and was) authorised under
     * @param busId
     * @returns BusPassengerServicePermitAssignmentResponse OK
     * @throws ApiError
     */
    public static getBusPermitLinks(
        busId: string,
    ): CancelablePromise<Array<BusPassengerServicePermitAssignmentResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/buses/{busId}/permit-links',
            path: {
                'busId': busId,
            },
        });
    }
    /**
     * Return a suspended or retired bus to service (MOT)
     * @param busId
     * @returns BusResponse OK
     * @throws ApiError
     */
    public static reinstateBus(
        busId: string,
    ): CancelablePromise<BusResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/buses/{busId}/reinstate',
            path: {
                'busId': busId,
            },
        });
    }
    /**
     * Retire a bus that no longer runs; ends its permit links
     * @param busId
     * @param requestBody
     * @returns BusResponse OK
     * @throws ApiError
     */
    public static retireBus(
        busId: string,
        requestBody: StatusReasonRequest,
    ): CancelablePromise<BusResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/buses/{busId}/retire',
            path: {
                'busId': busId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Suspend a bus from service (MOT)
     * @param busId
     * @param requestBody
     * @returns BusResponse OK
     * @throws ApiError
     */
    public static suspendBus(
        busId: string,
        requestBody: StatusReasonRequest,
    ): CancelablePromise<BusResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/buses/{busId}/suspend',
            path: {
                'busId': busId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
