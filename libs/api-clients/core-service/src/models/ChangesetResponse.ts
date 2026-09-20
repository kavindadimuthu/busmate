/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { JsonNode } from './JsonNode';
export type ChangesetResponse = {
    id?: string;
    entityType?: ChangesetResponse.entityType;
    action?: ChangesetResponse.action;
    targetId?: string;
    proposedValues?: JsonNode;
    targetSnapshot?: JsonNode;
    observedOn?: string;
    observationMethod?: ChangesetResponse.observationMethod;
    note?: string;
    status?: ChangesetResponse.status;
    proposerUserId?: string;
    createdAt?: string;
    decidedBy?: string;
    decidedAt?: string;
    decisionReason?: string;
};
export namespace ChangesetResponse {
    export enum entityType {
        STOP = 'STOP',
    }
    export enum action {
        CREATE = 'CREATE',
        UPDATE = 'UPDATE',
    }
    export enum observationMethod {
        RODE_THE_ROUTE = 'RODE_THE_ROUTE',
        LIVES_OR_WORKS_NEARBY = 'LIVES_OR_WORKS_NEARBY',
        TIMETABLE_OR_SIGNBOARD = 'TIMETABLE_OR_SIGNBOARD',
        TOLD_BY_CREW = 'TOLD_BY_CREW',
        OTHER = 'OTHER',
    }
    export enum status {
        PENDING = 'PENDING',
        APPROVED = 'APPROVED',
        REJECTED = 'REJECTED',
        WITHDRAWN = 'WITHDRAWN',
    }
}

