/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { JsonNode } from './JsonNode';
export type BusRequest = {
    operatorId: string;
    ntcRegistrationNumber: string;
    plateNumber: string;
    capacity?: number;
    model?: string;
    facilities?: JsonNode;
    status?: string;
};

