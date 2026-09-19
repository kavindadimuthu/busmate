/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * How far to trust a displayed value, and when it was last confirmed
 */
export type TrustInfo = {
    label?: TrustInfo.label;
    observedAt?: string;
};
export namespace TrustInfo {
    export enum label {
        OFFICIAL = 'OFFICIAL',
        OPERATOR_TIMETABLE = 'OPERATOR_TIMETABLE',
        OBSERVED = 'OBSERVED',
        REPORTED = 'REPORTED',
        ESTIMATED = 'ESTIMATED',
        LIVE = 'LIVE',
    }
}

