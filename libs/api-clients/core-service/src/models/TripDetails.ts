/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BusInfo } from './BusInfo';
import type { OperatorInfo } from './OperatorInfo';
import type { PspInfo } from './PspInfo';
import type { RealTimeInfo } from './RealTimeInfo';
/**
 * Trip-specific information
 */
export type TripDetails = {
    /**
     * Trip ID
     */
    tripId?: string;
    /**
     * Trip date
     */
    tripDate?: string;
    /**
     * Trip status (scheduled, active, completed, cancelled)
     */
    status?: string;
    /**
     * Scheduled departure time
     */
    scheduledDepartureTime?: string;
    /**
     * Scheduled arrival time
     */
    scheduledArrivalTime?: string;
    /**
     * Actual departure time (if departed)
     */
    actualDepartureTime?: string;
    /**
     * Actual arrival time (if completed)
     */
    actualArrivalTime?: string;
    /**
     * Delay in minutes (positive = late, negative = early)
     */
    delayMinutes?: number;
    /**
     * Bus information
     */
    bus?: BusInfo;
    /**
     * Operator information
     */
    operator?: OperatorInfo;
    /**
     * Passenger Service Permit information
     */
    psp?: PspInfo;
    /**
     * Real-time location data (if available)
     */
    realTime?: RealTimeInfo;
};

