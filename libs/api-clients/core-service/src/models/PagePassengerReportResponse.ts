/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PassengerReportResponse } from './PassengerReportResponse';
import type { Pageablenull } from './Pageablenull';
import type { Sortnull } from './Sortnull';
export type PagePassengerReportResponse = {
    totalElements?: number;
    totalPages?: number;
    pageable?: Pageablenull;
    size?: number;
    content?: Array<PassengerReportResponse>;
    number?: number;
    sort?: Sortnull;
    first?: boolean;
    last?: boolean;
    numberOfElements?: number;
    empty?: boolean;
};
