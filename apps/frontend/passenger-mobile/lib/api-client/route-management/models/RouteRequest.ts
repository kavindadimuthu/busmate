/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RouteStopRequest } from './RouteStopRequest';
export type RouteRequest = {
    id?: string;
    name: string;
    description?: string;
    startStopId: string;
    endStopId: string;
    distanceKm?: number;
    estimatedDurationMinutes?: number;
    direction: string;
    routeStops?: Array<RouteStopRequest>;
};

