/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UpdateUserDocumentRequest } from '../models/UpdateUserDocumentRequest';
import type { UserDocumentResponse } from '../models/UserDocumentResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UserDocumentsControllerService {
    /**
     * @param userId
     * @returns UserDocumentResponse OK
     * @throws ApiError
     */
    public static listUserDocuments(
        userId: string,
    ): CancelablePromise<Array<UserDocumentResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/{userId}/documents',
            path: {
                'userId': userId,
            },
        });
    }
    /**
     * @param userId
     * @param documentType
     * @param title
     * @param expiryDate
     * @param formData
     * @returns UserDocumentResponse OK
     * @throws ApiError
     */
    public static uploadUserDocument(
        userId: string,
        documentType: string,
        title?: string,
        expiryDate?: string,
        formData?: {
            file: Blob;
        },
    ): CancelablePromise<UserDocumentResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/{userId}/documents',
            path: {
                'userId': userId,
            },
            query: {
                'documentType': documentType,
                'title': title,
                'expiryDate': expiryDate,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * @param userId
     * @param documentId
     * @returns any OK
     * @throws ApiError
     */
    public static deleteUserDocument(
        userId: string,
        documentId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/users/{userId}/documents/{documentId}',
            path: {
                'userId': userId,
                'documentId': documentId,
            },
        });
    }
    /**
     * @param userId
     * @param documentId
     * @param requestBody
     * @returns UserDocumentResponse OK
     * @throws ApiError
     */
    public static updateUserDocument(
        userId: string,
        documentId: string,
        requestBody: UpdateUserDocumentRequest,
    ): CancelablePromise<UserDocumentResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/users/{userId}/documents/{documentId}',
            path: {
                'userId': userId,
                'documentId': documentId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param userId
     * @param documentId
     * @returns string OK
     * @throws ApiError
     */
    public static getUserDocumentContent(
        userId: string,
        documentId: string,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/{userId}/documents/{documentId}/content',
            path: {
                'userId': userId,
                'documentId': documentId,
            },
        });
    }
}
