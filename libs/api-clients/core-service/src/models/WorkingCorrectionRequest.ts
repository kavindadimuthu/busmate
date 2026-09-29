/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * A correction to an existing working, as the contributor now sees it
 */
export type WorkingCorrectionRequest = {
    targetWorkingId: string;
    operatorNameObserved?: string;
    platesObserved?: Array<string>;
    serviceClass?: WorkingCorrectionRequest.serviceClass;
    /**
     * The last day it applied, if it has stopped
     */
    effectiveEndDate?: string;
    /**
     * The day they saw it
     */
    observedOn: string;
    observationMethod: WorkingCorrectionRequest.observationMethod;
    note?: string;
};
export namespace WorkingCorrectionRequest {
    export enum serviceClass {
        NORMAL = 'NORMAL',
        SEMI_LUXURY = 'SEMI_LUXURY',
        LUXURY = 'LUXURY',
        SUPER_LUXURY = 'SUPER_LUXURY',
        EXPRESSWAY_SUPER_LUXURY = 'EXPRESSWAY_SUPER_LUXURY',
    }
    export enum observationMethod {
        RODE_THE_ROUTE = 'RODE_THE_ROUTE',
        LIVES_OR_WORKS_NEARBY = 'LIVES_OR_WORKS_NEARBY',
        TIMETABLE_OR_SIGNBOARD = 'TIMETABLE_OR_SIGNBOARD',
        TOLD_BY_CREW = 'TOLD_BY_CREW',
        OTHER = 'OTHER',
    }
}

