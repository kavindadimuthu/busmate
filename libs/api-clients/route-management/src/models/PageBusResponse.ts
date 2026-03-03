/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BusResponse } from './BusResponse';
import type { Pageablenull } from './Pageablenull';
import type { Sortnull } from './Sortnull';
export type PageBusResponse = {
    totalElements?: number;
    totalPages?: number;
    pageable?: Pageablenull;
    size?: number;
    content?: Array<BusResponse>;
    number?: number;
    sort?: Sortnull;
    first?: boolean;
    last?: boolean;
    numberOfElements?: number;
    empty?: boolean;
};

