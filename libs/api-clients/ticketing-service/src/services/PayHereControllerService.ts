/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PayHereHashRequestDTO } from '../models/PayHereHashRequestDTO';
import type { PayHereHashResponseDTO } from '../models/PayHereHashResponseDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PayHereControllerService {
    /**
     * @param formData
     * @returns string OK
     * @throws ApiError
     */
    public static notify(
        formData?: {
            merchant_id: string;
            order_id: string;
            payment_id?: string;
            payhere_amount: string;
            payhere_currency: string;
            status_code: string;
            md5sig: string;
        },
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/payments/payhere/notify',
            formData: formData,
            mediaType: 'application/x-www-form-urlencoded',
        });
    }
    /**
     * @param requestBody
     * @returns PayHereHashResponseDTO OK
     * @throws ApiError
     */
    public static getHash(
        requestBody: PayHereHashRequestDTO,
    ): CancelablePromise<PayHereHashResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/payments/payhere/hash',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
