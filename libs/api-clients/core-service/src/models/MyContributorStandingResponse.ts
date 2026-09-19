/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContributorResponse } from './ContributorResponse';
export type MyContributorStandingResponse = {
    status?: string;
    activeContributor?: boolean;
    canApply?: boolean;
    cannotApplyReason?: MyContributorStandingResponse.cannotApplyReason;
    contributor?: ContributorResponse;
};
export namespace MyContributorStandingResponse {
    export enum cannotApplyReason {
        NOT_A_PASSENGER = 'NOT_A_PASSENGER',
        EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
        ACCOUNT_NOT_ACTIVE = 'ACCOUNT_NOT_ACTIVE',
        ALREADY_APPLIED = 'ALREADY_APPLIED',
        ALREADY_CONTRIBUTOR = 'ALREADY_CONTRIBUTOR',
        SUSPENDED = 'SUSPENDED',
    }
}

