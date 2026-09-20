/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChangesetResponse } from './ChangesetResponse';
import type { ContributorTrackRecord } from './ContributorTrackRecord';
import type { StopResponse } from './StopResponse';
export type ChangesetReviewResponse = {
    changeset?: ChangesetResponse;
    currentStop?: StopResponse;
    positionDistanceMeters?: number;
    proposerAffiliation?: ChangesetReviewResponse.proposerAffiliation;
    proposerTrackRecord?: ContributorTrackRecord;
    targetOutranksCommunityTier?: boolean;
    stale?: boolean;
};
export namespace ChangesetReviewResponse {
    export enum proposerAffiliation {
        NONE = 'NONE',
        OPERATOR_EMPLOYEE = 'OPERATOR_EMPLOYEE',
        BUS_OWNER = 'BUS_OWNER',
        OTHER = 'OTHER',
    }
}

