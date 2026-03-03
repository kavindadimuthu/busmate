/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeviceResponse } from './DeviceResponse';
/**
 * Standard API Response wrapper
 */
export type ApiResponse_DeviceResponse_ = {
    /**
     * Indicates if the request was successful
     */
    success: boolean;
    /**
     * Response data
     */
    data?: DeviceResponse;
    /**
     * Error message if request failed
     */
    message?: string;
    /**
     * Additional metadata
     */
    meta?: {
        /**
         * Processing time in milliseconds
         */
        processingTime?: number;
        /**
         * Items per page
         */
        limit?: number;
        /**
         * Current page number
         */
        page?: number;
        /**
         * Total count for paginated responses
         */
        total?: number;
    };
};

