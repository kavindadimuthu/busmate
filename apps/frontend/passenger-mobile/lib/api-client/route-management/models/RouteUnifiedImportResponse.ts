/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ImportError } from './ImportError';
import type { ImportSummary } from './ImportSummary';
import type { ImportWarning } from './ImportWarning';
export type RouteUnifiedImportResponse = {
    totalRecords?: number;
    successfulImports?: number;
    failedImports?: number;
    skippedRecords?: number;
    errors?: Array<ImportError>;
    warnings?: Array<ImportWarning>;
    message?: string;
    summary?: ImportSummary;
};

