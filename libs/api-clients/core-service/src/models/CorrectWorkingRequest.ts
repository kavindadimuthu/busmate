/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * A correction to a working's observed fields. Anything left out stays as it is
 */
export type CorrectWorkingRequest = {
    operatorNameObserved?: string;
    /**
     * Replaces the whole list when given; leave out to keep the vehicles as they are
     */
    platesObserved?: Array<string>;
    serviceClass?: CorrectWorkingRequest.serviceClass;
    /**
     * The last day it applied, if it has stopped
     */
    effectiveEndDate?: string;
};
export namespace CorrectWorkingRequest {
    export enum serviceClass {
        NORMAL = 'NORMAL',
        SEMI_LUXURY = 'SEMI_LUXURY',
        LUXURY = 'LUXURY',
        SUPER_LUXURY = 'SUPER_LUXURY',
        EXPRESSWAY_SUPER_LUXURY = 'EXPRESSWAY_SUPER_LUXURY',
    }
}

