/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ErrorRecord } from './ErrorRecord';
import type { SkippedRecord } from './SkippedRecord';
import type { UpdateMetadata } from './UpdateMetadata';
import type { UpdateResult } from './UpdateResult';
import type { UpdateSummary } from './UpdateSummary';
export type StopBulkUpdateResponse = {
    summary?: UpdateSummary;
    updateResults?: Array<UpdateResult>;
    skippedRecords?: Array<SkippedRecord>;
    errorRecords?: Array<ErrorRecord>;
    metadata?: UpdateMetadata;
};

