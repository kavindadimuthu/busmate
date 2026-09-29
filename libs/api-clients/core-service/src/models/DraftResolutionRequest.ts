/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ResolvedRow } from './ResolvedRow';
export type DraftResolutionRequest = {
    sourceLabel: string;
    observedOn: string;
    rows: Array<ResolvedRow>;
    acknowledgedUnaccountedLines?: Array<string>;
};
