/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PassengerBusInfo } from './PassengerBusInfo';
import type { PassengerIntermediateStop } from './PassengerIntermediateStop';
import type { PassengerOperatorSummary } from './PassengerOperatorSummary';
import type { PassengerStopSummary } from './PassengerStopSummary';
export type PassengerTripResponse = {
    tripId?: string;
    routeName?: string;
    scheduledDeparture?: string;
    scheduledArrival?: string;
    estimatedDeparture?: string;
    estimatedArrival?: string;
    duration?: number;
    distance?: number;
    scheduleId?: string;
    routeId?: string;
    routeGroupId?: string;
    operatorId?: string;
    busId?: string;
    departureStop?: PassengerStopSummary;
    arrivalStop?: PassengerStopSummary;
    intermediateStops?: Array<PassengerIntermediateStop>;
    bus?: PassengerBusInfo;
    operator?: PassengerOperatorSummary;
    fare?: number;
    status?: string;
    delay?: number;
    availableSeats?: number;
    bookingAvailable?: boolean;
};

