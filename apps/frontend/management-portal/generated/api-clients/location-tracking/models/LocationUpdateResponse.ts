/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Location update response
 */
export type LocationUpdateResponse = {
    /**
     * Update identifier
     */
    updateId: string;
    /**
     * Trip identifier
     */
    tripId: string;
    /**
     * Processing timestamp
     */
    processedAt: string;
    /**
     * Validation status
     */
    isValid: boolean;
    /**
     * Processing details
     */
    processingDetails?: {
        /**
         * Any validation warnings
         */
        warnings?: Array<string>;
        /**
         * Speed calculated from movement
         */
        calculatedSpeed?: number;
        /**
         * Distance from previous location
         */
        distanceFromPrevious?: number;
    };
};

