/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RouteStopRequest } from './RouteStopRequest';
export type RouteRequest = {
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

