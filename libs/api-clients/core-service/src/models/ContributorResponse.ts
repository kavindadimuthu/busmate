/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ContributorResponse = {
    userId?: string;
    status?: ContributorResponse.status;
    level?: ContributorResponse.level;
    motivation?: string;
    homeDistrict?: string;
    corridorRouteGroupIds?: Array<string>;
    affiliation?: ContributorResponse.affiliation;
    affiliationDetail?: string;
    agreementVersion?: string;
    agreementCurrent?: boolean;
    agreementAcceptedAt?: string;
    appliedAt?: string;
    decidedBy?: string;
    decidedAt?: string;
    decisionReason?: string;
};
export namespace ContributorResponse {
    export enum status {
        APPLIED = 'APPLIED',
        ACTIVE = 'ACTIVE',
        DECLINED = 'DECLINED',
        SUSPENDED = 'SUSPENDED',
    }
    export enum level {
        CONTRIBUTOR = 'CONTRIBUTOR',
        STEWARD = 'STEWARD',
    }
    export enum affiliation {
        NONE = 'NONE',
        OPERATOR_EMPLOYEE = 'OPERATOR_EMPLOYEE',
        BUS_OWNER = 'BUS_OWNER',
        OTHER = 'OTHER',
    }
}

