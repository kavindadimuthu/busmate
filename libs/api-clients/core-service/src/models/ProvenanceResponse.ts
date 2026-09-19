/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ProvenanceResponse = {
    sourceTier?: ProvenanceResponse.sourceTier;
    observedAt?: string;
    baseConfidence?: number;
    attributedUserId?: string;
    attributionLabel?: string;
};
export namespace ProvenanceResponse {
    export enum sourceTier {
        SRC_1 = 'SRC_1',
        SRC_2 = 'SRC_2',
        SRC_3 = 'SRC_3',
        SRC_4 = 'SRC_4',
        SRC_5 = 'SRC_5',
        SRC_6 = 'SRC_6',
    }
}

