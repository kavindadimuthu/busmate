/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PspTripAssignment } from './PspTripAssignment';
/**
 * Request for bulk PSP to Trip assignments
 */
export type BulkPspAssignmentRequest = {
    /**
     * List of PSP-Trip assignment pairs
     */
    assignments: Array<PspTripAssignment>;
};

