/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseFareDTO } from '../models/BaseFareDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BaseFareControllerService {
    /**
     * @param requestBody
     * @returns string OK
     * @throws ApiError
     */
    public static saveBaseFare(
        requestBody: BaseFareDTO,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/baseFare/save-section',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param section
     * @param type
     * @returns string OK
     * @throws ApiError
     */
    public static getBaseFareBySectionAndType(
        section: string,
        type: string,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/baseFare/get-fare-by-sectionAnd-type',
            query: {
                'section': section,
                'type': type,
            },
        });
    }
}
