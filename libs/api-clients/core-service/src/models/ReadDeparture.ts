/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ReadDeparture = {
    time?: string;
    origin?: string;
    destination?: string;
    operatorName?: string;
    plates?: Array<string>;
    serviceClass?: string;
    days?: string;
    notes?: string;
    /**
     * The exact line(s) of the pasted text this departure was read from, quoted verbatim.
     */
    sourceLines?: Array<string>;
};
