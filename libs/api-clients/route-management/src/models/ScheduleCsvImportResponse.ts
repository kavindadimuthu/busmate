/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ImportError } from './ImportError';
import type { ImportSummary } from './ImportSummary';
import type { ImportWarning } from './ImportWarning';
/**
 * Response from CSV-based schedule import operation
 */
export type ScheduleCsvImportResponse = {
    /**
     * Total number of rows processed from CSV (excluding header)
     */
    totalRows?: number;
    /**
     * Number of unique schedules identified in CSV
     */
    totalSchedulesIdentified?: number;
    /**
     * Number of schedules successfully imported/updated
     */
    successfulSchedules?: number;
    /**
     * Number of schedules that failed to import
     */
    failedSchedules?: number;
    /**
     * Number of schedules skipped due to duplicate handling strategy
     */
    skippedSchedules?: number;
    /**
     * Total number of schedule stops created
     */
    totalStopsCreated?: number;
    /**
     * Total number of schedule stops that failed
     */
    totalStopsFailed?: number;
    /**
     * List of errors encountered during import
     */
    errors?: Array<ImportError>;
    /**
     * List of warnings generated during import
     */
    warnings?: Array<ImportWarning>;
    /**
     * Summary message describing the import result
     */
    message?: string;
    /**
     * Detailed summary of what was created/updated
     */
    summary?: ImportSummary;
};

