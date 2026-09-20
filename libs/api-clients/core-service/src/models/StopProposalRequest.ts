/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LocationDto } from './LocationDto';
export type StopProposalRequest = {
    targetStopId?: string;
    name: string;
    nameSinhala?: string;
    nameTamil?: string;
    description?: string;
    location: LocationDto;
    isAccessible?: boolean;
    observedOn: string;
    observationMethod: StopProposalRequest.observationMethod;
    note?: string;
    confirmDuplicate?: boolean;
};
export namespace StopProposalRequest {
    export enum observationMethod {
        RODE_THE_ROUTE = 'RODE_THE_ROUTE',
        LIVES_OR_WORKS_NEARBY = 'LIVES_OR_WORKS_NEARBY',
        TIMETABLE_OR_SIGNBOARD = 'TIMETABLE_OR_SIGNBOARD',
        TOLD_BY_CREW = 'TOLD_BY_CREW',
        OTHER = 'OTHER',
    }
}

