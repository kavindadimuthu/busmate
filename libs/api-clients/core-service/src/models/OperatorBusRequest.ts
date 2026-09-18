/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { JsonNode } from './JsonNode';
export type OperatorBusRequest = {
    ntcRegistrationNumber: string;
    plateNumber: string;
    capacity: number;
    model?: string;
    serviceClass: string;
    facilities?: JsonNode;
    seatLayout?: JsonNode;
    manufactureYear?: number;
    chassisNumber?: string;
    engineNumber?: string;
};

