/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * A vehicle by its plate as seen, and/or a registered bus
 */
export type VehicleClaim = {
    /**
     * A registered bus, if staff already know which
     */
    busId?: string;
    /**
     * The plate as seen, e.g. ND-1712
     */
    plateObserved?: string;
};

