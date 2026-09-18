/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { JsonNode } from './JsonNode';
export type BusResponse = {
    id?: string;
    operatorId?: string;
    operatorName?: string;
    ntcRegistrationNumber?: string;
    plateNumber?: string;
    capacity?: number;
    model?: string;
    facilities?: JsonNode;
    seatLayout?: JsonNode;
    serviceClass?: string;
    status?: string;
    statusReason?: string;
    manufactureYear?: number;
    chassisNumber?: string;
    engineNumber?: string;
    availability?: string;
    availabilityFrom?: string;
    availabilityUntil?: string;
    availabilityNote?: string;
    availableToday?: boolean;
    coverPhotoId?: string;
    photoCount?: number;
    documentCount?: number;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
};

