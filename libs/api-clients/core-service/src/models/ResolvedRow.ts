/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import { RowAction } from './RowAction';
export type ResolvedRow = {
    sourceIndex: number;
    action: RowAction;
    time?: string;
    origin?: string;
    destination?: string;
    operatorName?: string;
    plates?: Array<string>;
    serviceClass?: string;
    days?: string;
    notes?: string;
    /**
     * Set only when staff picked a specific existing stop from a search; left unset, loading matches by name and creates a stop if nothing matches.
     */
    originStopId?: string;
    destinationStopId?: string;
    /**
     * Required at approval time for a row the checks flagged and that is still being loaded.
     */
    overrideReason?: string;
};
