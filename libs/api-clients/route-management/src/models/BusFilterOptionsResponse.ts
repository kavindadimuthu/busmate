/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OperatorOption } from './OperatorOption';
export type BusFilterOptionsResponse = {
    statuses?: Array<string>;
    operators?: Array<OperatorOption>;
    models?: Array<string>;
    capacityRanges?: Array<string>;
    sortOptions?: Array<string>;
    capacityRange?: Record<string, number>;
};

