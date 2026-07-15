/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TypePermissionResponse } from './TypePermissionResponse';
export type UserTypeDetailResponse = {
    id?: string;
    name?: string;
    displayName?: string;
    description?: string;
    isSystem?: boolean;
    isActive?: boolean;
    permissions?: Array<TypePermissionResponse>;
};

