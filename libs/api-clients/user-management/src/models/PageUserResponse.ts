/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Pageablenull } from './Pageablenull';
import type { Sortnull } from './Sortnull';
import type { UserResponse } from './UserResponse';
export type PageUserResponse = {
    totalElements?: number;
    totalPages?: number;
    pageable?: Pageablenull;
    size?: number;
    content?: Array<UserResponse>;
    number?: number;
    sort?: Sortnull;
    first?: boolean;
    last?: boolean;
    numberOfElements?: number;
    empty?: boolean;
};

