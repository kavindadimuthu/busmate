/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TripRequest = {
    /**
     * Passenger Service Permit ID - Optional, can be assigned later
     */
    passengerServicePermitId?: string;
    scheduleId: string;
    tripDate: string;
    scheduledDepartureTime: string;
    scheduledArrivalTime: string;
    actualDepartureTime?: string;
    actualArrivalTime?: string;
    busId?: string;
    driverId?: string;
    conductorId?: string;
    status?: TripRequest.status;
    notes?: string;
};
export namespace TripRequest {
    export enum status {
        PENDING = 'pending',
        ACTIVE = 'active',
        COMPLETED = 'completed',
        CANCELLED = 'cancelled',
        DELAYED = 'delayed',
        IN_TRANSIT = 'in_transit',
        BOARDING = 'boarding',
        DEPARTED = 'departed',
    }
}

