/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TrustInfo } from './TrustInfo';
import type { Vehicle } from './Vehicle';
export type ScheduleWorkingResponse = {
    id?: string;
    scheduleId?: string;
    effectiveStartDate?: string;
    effectiveEndDate?: string;
    operatorId?: string;
    operatorName?: string;
    operatorResolved?: boolean;
    operatorNameObserved?: string;
    serviceClass?: ScheduleWorkingResponse.serviceClass;
    trust?: TrustInfo;
    vehicles?: Array<Vehicle>;
};
export namespace ScheduleWorkingResponse {
    export enum serviceClass {
        NORMAL = 'NORMAL',
        SEMI_LUXURY = 'SEMI_LUXURY',
        LUXURY = 'LUXURY',
        SUPER_LUXURY = 'SUPER_LUXURY',
        EXPRESSWAY_SUPER_LUXURY = 'EXPRESSWAY_SUPER_LUXURY',
    }
}

