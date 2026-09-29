/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PostImportDraftSummary = {
    id?: string;
    status?: PostImportDraftSummary.status;
    aiProvider?: string;
    departureCount?: number;
    ungroundedCount?: number;
    unaccountedCount?: number;
    createdAt?: string;
    createdBy?: string;
};
export namespace PostImportDraftSummary {
    export enum status {
        READ = 'READ',
        FAILED = 'FAILED',
    }
}
