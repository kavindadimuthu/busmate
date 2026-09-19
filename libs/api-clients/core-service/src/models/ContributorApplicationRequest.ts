/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ContributorApplicationRequest = {
    motivation: string;
    homeDistrict?: string;
    corridorRouteGroupIds?: Array<string>;
    affiliation: ContributorApplicationRequest.affiliation;
    affiliationDetail?: string;
    agreementVersion: string;
};
export namespace ContributorApplicationRequest {
    export enum affiliation {
        NONE = 'NONE',
        OPERATOR_EMPLOYEE = 'OPERATOR_EMPLOYEE',
        BUS_OWNER = 'BUS_OWNER',
        OTHER = 'OTHER',
    }
}

