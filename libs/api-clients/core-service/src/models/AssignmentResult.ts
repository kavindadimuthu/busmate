/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TripResponse } from './TripResponse';
/**
 * Individual assignment result
 */
export type AssignmentResult = {
    /**
     * Trip ID
     */
    tripId?: string;
    /**
     * PSP ID
     */
    passengerServicePermitId?: string;
    /**
     * Success status
     */
    success?: boolean;
    /**
     * Error message if assignment failed
     */
    errorMessage?: string;
    /**
     * Trip details for successful assignments
     */
    tripResponse?: TripResponse;
};

