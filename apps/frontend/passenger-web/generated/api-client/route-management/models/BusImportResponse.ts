/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ImportError } from './ImportError';
export type BusImportResponse = {
    totalRecords?: number;
    successfulImports?: number;
    failedImports?: number;
    errors?: Array<ImportError>;
    message?: string;
};

