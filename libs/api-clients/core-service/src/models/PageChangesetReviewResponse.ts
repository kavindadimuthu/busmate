/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChangesetReviewResponse } from './ChangesetReviewResponse';
import type { Pageablenull } from './Pageablenull';
import type { Sortnull } from './Sortnull';
export type PageChangesetReviewResponse = {
    totalElements?: number;
    totalPages?: number;
    pageable?: Pageablenull;
    size?: number;
    content?: Array<ChangesetReviewResponse>;
    number?: number;
    sort?: Sortnull;
    first?: boolean;
    last?: boolean;
    numberOfElements?: number;
    empty?: boolean;
};

