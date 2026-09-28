/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PassengerReportResponse = {
    id?: string;
    entityType?: PassengerReportResponse.entityType;
    targetId?: string;
    reason?: PassengerReportResponse.reason;
    note?: string;
    status?: PassengerReportResponse.status;
    createdAt?: string;
    resolvedAt?: string;
    resolutionNote?: string;
};
export namespace PassengerReportResponse {
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
    export enum status {
        OPEN = 'OPEN',
        RESOLVED = 'RESOLVED',
    }
}

