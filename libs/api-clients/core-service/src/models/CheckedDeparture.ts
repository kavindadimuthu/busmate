/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ReadDeparture } from './ReadDeparture';
export type CheckedDeparture = {
    departure?: ReadDeparture;
    /**
     * False when a claimed field isn't backed by the text this departure's own sourceLines quote.
     */
    grounded?: boolean;
    ungroundedFields?: Array<string>;
};
