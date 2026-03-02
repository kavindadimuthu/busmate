/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PassengerServicePermitRequest = {
    operatorId: string;
    routeGroupId: string;
    permitNumber: string;
    issueDate: string;
    expiryDate?: string;
    maximumBusAssigned?: number;
    status?: string;
    permitType?: string;
};

