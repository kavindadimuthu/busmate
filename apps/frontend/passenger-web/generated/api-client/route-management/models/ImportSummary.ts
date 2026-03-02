/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreatedSchedule } from './CreatedSchedule';
import type { ImportOptionsUsed } from './ImportOptionsUsed';
/**
 * Summary of import results
 */
export type ImportSummary = {
    /**
     * Number of new schedules created
     */
    schedulesCreated?: number;
    /**
     * Number of existing schedules updated
     */
    schedulesUpdated?: number;
    /**
     * Number of schedules skipped (duplicate strategy)
     */
    schedulesSkipped?: number;
    /**
     * Number of schedule stops created
     */
    stopsCreated?: number;
    /**
     * Number of schedule stops updated
     */
    stopsUpdated?: number;
    /**
     * Number of schedule stops skipped
     */
    stopsSkipped?: number;
    /**
     * Timestamp when import was processed
     */
    processedAt?: string;
    /**
     * User ID who performed the import
     */
    processedBy?: string;
    /**
     * List of successfully created/updated schedules with details
     */
    createdSchedules?: Array<CreatedSchedule>;
    /**
     * Options that were used during import
     */
    optionsUsed?: ImportOptionsUsed;
};

