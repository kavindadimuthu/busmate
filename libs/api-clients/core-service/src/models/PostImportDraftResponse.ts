/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CheckedDeparture } from './CheckedDeparture';
import type { SkippedLine } from './SkippedLine';
export type PostImportDraftResponse = {
    id?: string;
    pastedText?: string;
    aiProvider?: string;
    aiModel?: string;
    status?: PostImportDraftResponse.status;
    /**
     * The date the post itself states it was written or applies from, exactly as written — not stated for every post.
     */
    postDate?: string;
    departures?: Array<CheckedDeparture>;
    skipped?: Array<SkippedLine>;
    /**
     * Timed lines of the post that were neither read as a departure nor explicitly skipped.
     */
    unaccountedLines?: Array<string>;
    createdAt?: string;
    createdBy?: string;
};
export namespace PostImportDraftResponse {
    export enum status {
        READ = 'READ',
        FAILED = 'FAILED',
    }
}
