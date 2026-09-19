/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RouteStopRequest } from './RouteStopRequest';
export type RouteRequest = {
    sourceTier?: RouteRequest.sourceTier;
    attributionLabel?: string;
    name: string;
    nameSinhala?: string;
    nameTamil?: string;
    routeNumber?: string;
    description?: string;
    roadType?: string;
    routeThrough?: string;
    routeThroughSinhala?: string;
    routeThroughTamil?: string;
    routeGroupId: string;
    startStopId: string;
    endStopId: string;
    distanceKm?: number;
    estimatedDurationMinutes?: number;
    direction: string;
    routeStops?: Array<RouteStopRequest>;
};
export namespace RouteRequest {
    export enum sourceTier {
        SRC_1 = 'SRC_1',
        SRC_2 = 'SRC_2',
        SRC_3 = 'SRC_3',
        SRC_4 = 'SRC_4',
        SRC_5 = 'SRC_5',
        SRC_6 = 'SRC_6',
    }
}

