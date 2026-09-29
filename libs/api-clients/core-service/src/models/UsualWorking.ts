/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TrustInfo } from './TrustInfo';
/**
 * Who usually works this departure. Never a guarantee about a particular day.
 */
export type UsualWorking = {
    /**
     * The working this claim is; lets a passenger propose a correction to the right one
     */
    id?: string;
    /**
     * The operator's name: the registered one if linked, else as seen
     */
    operatorName?: string;
    /**
     * NORMAL, SEMI_LUXURY, LUXURY, SUPER_LUXURY or EXPRESSWAY_SUPER_LUXURY; absent if not stated
     */
    serviceClass?: string;
    /**
     * Plates, as registered or as seen. More than one means the operator alternates among them
     */
    plates?: Array<string>;
    trust?: TrustInfo;
};

