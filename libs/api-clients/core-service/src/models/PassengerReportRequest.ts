/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * A passenger saying something is wrong about a departure or who runs it
 */
export type PassengerReportRequest = {
    entityType: PassengerReportRequest.entityType;
    targetId: string;
    reason: PassengerReportRequest.reason;
    note?: string;
};
export namespace PassengerReportRequest {
    export enum entityType {
        SCHEDULE = 'SCHEDULE',
        SCHEDULE_WORKING = 'SCHEDULE_WORKING',
    }
    export enum reason {
        WRONG_TIME = 'WRONG_TIME',
        WRONG_DAYS = 'WRONG_DAYS',
        BUS_DID_NOT_COME = 'BUS_DID_NOT_COME',
        WRONG_OPERATOR_OR_PLATE = 'WRONG_OPERATOR_OR_PLATE',
        OTHER = 'OTHER',
    }
}

