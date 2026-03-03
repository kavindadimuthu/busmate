/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LocationDto } from './LocationDto';
export type ScheduleStopDetailResponse = {
    scheduleStopId?: string;
    routeStopId?: string;
    stopId?: string;
    stopName?: string;
    stopDescription?: string;
    location?: LocationDto;
    isAccessible?: boolean;
    stopOrder?: number;
    distanceFromStartKm?: number;
    arrivalTime?: string;
    departureTime?: string;
};

