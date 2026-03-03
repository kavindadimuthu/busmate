/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FinanceOfficerDTO } from '../models/FinanceOfficerDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FinanceOfficerConterollerService {
    /**
     * @param requestBody
     * @returns string OK
     * @throws ApiError
     */
    public static addfinanceoffice(
        requestBody: FinanceOfficerDTO,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/finance-officer/register',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
