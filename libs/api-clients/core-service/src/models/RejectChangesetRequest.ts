/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type RejectChangesetRequest = {
    reason: RejectChangesetRequest.reason;
    note?: string;
};
export namespace RejectChangesetRequest {
    export enum reason {
        DUPLICATE = 'DUPLICATE',
        WRONG_POSITION = 'WRONG_POSITION',
        CANNOT_VERIFY = 'CANNOT_VERIFY',
        NOT_A_STOP = 'NOT_A_STOP',
        OTHER = 'OTHER',
    }
}

