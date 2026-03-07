/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LocationUpdateResponse } from './LocationUpdateResponse';
/**
 * Standard API Response wrapper
 */
export type ApiResponse_LocationUpdateResponse_ = {
    /**
     * Indicates if the request was successful
     */
    success: boolean;
    /**
     * Response data
     */
    data?: LocationUpdateResponse;
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

