/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { VehicleClaim } from './VehicleClaim';
/**
 * Who normally works a departure between two dates. A claim about a pattern, not a particular day.
 */
export type ScheduleWorkingRequest = {
    /**
     * First day it applies. Optional: takes today's date, as a schedule does
     */
    effectiveStartDate?: string;
    /**
     * Last day it applies; leave out while it is still current
     */
    effectiveEndDate?: string;
    /**
     * A real operator, if staff already know which
     */
    operatorId?: string;
    /**
     * The operator as seen, e.g. "Weerasinghe Midnight Express"
     */
    operatorNameObserved?: string;
    serviceClass?: ScheduleWorkingRequest.serviceClass;
    /**
     * One row means this vehicle; several mean the operator alternates among them, order unknown
     */
    vehicles?: Array<VehicleClaim>;
    /**
     * Source recorded; SRC_1 is MOT only. Defaults to field observation
     */
    sourceTier?: ScheduleWorkingRequest.sourceTier;
    attributionLabel?: string;
};
export namespace ScheduleWorkingRequest {
    export enum serviceClass {
        NORMAL = 'NORMAL',
        SEMI_LUXURY = 'SEMI_LUXURY',
        LUXURY = 'LUXURY',
        SUPER_LUXURY = 'SUPER_LUXURY',
        EXPRESSWAY_SUPER_LUXURY = 'EXPRESSWAY_SUPER_LUXURY',
    }
    /**
     * Source recorded; SRC_1 is MOT only. Defaults to field observation
     */
    export enum sourceTier {
        SRC_1 = 'SRC_1',
        SRC_2 = 'SRC_2',
        SRC_3 = 'SRC_3',
        SRC_4 = 'SRC_4',
        SRC_5 = 'SRC_5',
        SRC_6 = 'SRC_6',
    }
}

