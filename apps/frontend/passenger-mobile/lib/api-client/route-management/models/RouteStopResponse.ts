/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LocationDto } from './LocationDto';
export type RouteStopResponse = {
    id?: string;
    stopId?: string;
    stopName?: string;
    location?: LocationDto;
    stopOrder?: number;
    distanceFromStartKm?: number;
    distanceFromStartKmUnverified?: number;
    distanceFromStartKmCalculated?: number;
};

