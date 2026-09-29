/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Who usually works a departure, as the contributor saw it
 */
export type WorkingProposalRequest = {
    scheduleId: string;
    /**
     * The operator as seen on the bus, e.g. "Weerasinghe Midnight Express"
     */
    operatorNameObserved?: string;
    /**
     * Plates as seen. One means this vehicle; several mean it alternates among them
     */
    platesObserved?: Array<string>;
    serviceClass?: WorkingProposalRequest.serviceClass;
    /**
     * The day they saw it
     */
    observedOn: string;
    observationMethod: WorkingProposalRequest.observationMethod;
    note?: string;
};
export namespace WorkingProposalRequest {
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

