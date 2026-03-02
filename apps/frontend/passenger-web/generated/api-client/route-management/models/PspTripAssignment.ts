/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Individual PSP to Trip assignment
 */
export type PspTripAssignment = {
    /**
     * ID of the trip to assign PSP to
     */
    tripId: string;
    /**
     * ID of the PSP to assign to the trip
     */
    passengerServicePermitId: string;
    /**
     * Optional notes for this assignment
     */
    notes?: string;
};

