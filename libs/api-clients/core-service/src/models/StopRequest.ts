/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LocationDto } from './LocationDto';
export type StopRequest = {
    sourceTier?: StopRequest.sourceTier;
    attributionLabel?: string;
    name: string;
    nameSinhala?: string;
    nameTamil?: string;
    description?: string;
    location: LocationDto;
    isAccessible?: boolean;
};
export namespace StopRequest {
    export enum sourceTier {
        SRC_1 = 'SRC_1',
        SRC_2 = 'SRC_2',
        SRC_3 = 'SRC_3',
        SRC_4 = 'SRC_4',
        SRC_5 = 'SRC_5',
        SRC_6 = 'SRC_6',
    }
}

