/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssignmentResult } from './AssignmentResult';
/**
 * Response for bulk PSP assignment operation
 */
export type BulkPspAssignmentResponse = {
    /**
     * Total number of assignments requested
     */
    totalRequested?: number;
    /**
     * Number of successful assignments
     */
    successfulAssignments?: number;
    /**
     * Number of failed assignments
     */
    failedAssignments?: number;
    /**
     * Processing timestamp
     */
    processedAt?: string;
    /**
     * List of successful assignment results
     */
    successfulResults?: Array<AssignmentResult>;
    /**
     * List of failed assignment results with error details
     */
    failedResults?: Array<AssignmentResult>;
};

